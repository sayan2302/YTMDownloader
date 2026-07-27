import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Music, Disc3, Clock, Maximize2, Play, Download, ExternalLink, Hash, Check, Mic2, Sparkles, Trophy, Quote, X } from 'lucide-react';
import { getHighResThumbnail } from '../../utils/thumbnail';
import SmartImage from '../Common/SmartImage';
import './SongCard.css';

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SongCard({ song, onDownload, onFlyAnimation, downloadStatus, downloadPercent, onPlay, isCurrentlyPlaying }) {
  const buttonRef = useRef(null);
  const cardRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [modalRect, setModalRect] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [hasLyrics, setHasLyrics] = useState(false);
  const [trivia, setTrivia] = useState(null);

  useEffect(() => {
    if (showModal && song?.title) {
      fetch(`/api/trivia?title=${encodeURIComponent(song.title)}&artist=${encodeURIComponent(song.artist || '')}`)
        .then(res => res.json())
        .then(data => setTrivia(data))
        .catch(() => setTrivia(null));
    }
  }, [showModal, song?.title, song?.artist]);

  useEffect(() => {
    const targetId = song?.videoId || song?.id;
    if (!targetId) return;

    let isMounted = true;
    fetch(`/api/lyrics/check/${targetId}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data?.hasLyrics) {
          setHasLyrics(true);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [song?.videoId, song?.id]);

  const handleDownloadClick = () => {
    if (buttonRef.current && onFlyAnimation) {
      const rect = buttonRef.current.getBoundingClientRect();
      onFlyAnimation({
        thumbnailSrc: song.thumbnail,
        startRect: rect
      });
    }
    onDownload(song);
  };

  const getModalStyle = () => {
    if (!modalRect) return {};
    
    const modalWidth = Math.max(350, modalRect.width * 1.15);
    const estimatedHeight = modalWidth + 180;
    
    let top = modalRect.top + modalRect.height / 2;
    let left = modalRect.left + modalRect.width / 2;
    
    const halfHeight = estimatedHeight / 2;
    const padding = 20; // safe margin from viewport edges
    
    // Clamp vertical position
    if (top - halfHeight < padding) {
      top = halfHeight + padding;
    } else if (top + halfHeight > window.innerHeight - padding) {
      top = window.innerHeight - halfHeight - padding;
    }
    
    // Clamp horizontal position
    const halfWidth = modalWidth / 2;
    if (left - halfWidth < padding) {
      left = halfWidth + padding;
    } else if (left + halfWidth > window.innerWidth - padding) {
      left = window.innerWidth - halfWidth - padding;
    }
    
    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${modalWidth}px`,
      transform: 'translate(-50%, -50%) scale(1)'
    };
  };

  const handleThumbnailClick = (e) => {
    e.stopPropagation();
    if (cardRef.current) {
      setModalRect(cardRef.current.getBoundingClientRect());
      setShowModal(true);
    }
  };

  return (
    <>
      <div 
        ref={cardRef}
        className={`song-card liquid-glass ${isCurrentlyPlaying ? 'playing' : ''}`}
      >
      <div 
        className="song-card-body" 
        onClick={(e) => {
          if (onPlay) {
            const thumbEl = e.currentTarget.querySelector('.song-thumbnail');
            const rect = thumbEl ? thumbEl.getBoundingClientRect() : e.currentTarget.getBoundingClientRect();
            onPlay(song, rect);
          }
        }}
        title="Play song"
      >
        <div className="song-thumbnail">
          <SmartImage 
            src={song.thumbnail} 
            videoId={song.videoId || song.id} 
            alt={song.title} 
            size={400} 
            iconSize={24}
          />
          {isCurrentlyPlaying && (
            <div className="equalizer-overlay">
              <div className="bar bar1"></div>
              <div className="bar bar2"></div>
              <div className="bar bar3"></div>
            </div>
          )}
          {hasLyrics && (
            <div className="card-lyrics-badge" title="Live Synced Lyrics Available">
              <Mic2 size={12} />
            </div>
          )}
        </div>
        
        <div className="song-info">
          <h3 className="song-title">{song.title}</h3>
          <p className="song-meta">
            {song.artist} {song.album && `• ${song.album}`} • {formatDuration(song.duration)}
          </p>
        </div>
      </div>

      {/* Cyber-Wallet Slideout Action Menu */}
      <div className="song-card-wallet-menu">
        {hasLyrics && (
          <button 
            className="wallet-action-btn lyrics-btn" 
            onClick={(e) => {
              e.stopPropagation();
              if (onPlay) onPlay(song, null, { autoLyrics: true });
            }} 
            title="Play in Karaoke Lyrics Mode"
          >
            <Mic2 size={15} />
          </button>
        )}

        {(!downloadStatus || downloadStatus === 'completed' || downloadStatus === 'error') && (
          <button 
            ref={buttonRef}
            className="wallet-action-btn download-btn" 
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadClick();
            }} 
            title="Download Track"
          >
            <Download size={15} />
          </button>
        )}

        {(downloadStatus === 'queued' || downloadStatus === 'downloading') && (
          <div className="wallet-progress-indicator" title={`Downloading: ${downloadPercent || 0}%`}>
            <div className="wallet-spinner"></div>
          </div>
        )}

        <button 
          className="wallet-action-btn details-btn" 
          onClick={(e) => {
            e.stopPropagation();
            handleThumbnailClick(e);
          }} 
          title="Inspect Details"
        >
          <Maximize2 size={15} />
        </button>
      </div>

      {(downloadStatus === 'queued' || downloadStatus === 'downloading') && (() => {
        const pctFloat = parseFloat(downloadPercent) || 0;
        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference - (pctFloat / 100) * circumference;
        
        return (
          <div className="progress-ring">
            <svg width="40" height="40" viewBox="0 0 40 40">
              <circle cx="20" cy="20" r={radius} fill="none" stroke="var(--border)" strokeWidth="3" />
              <circle 
                className={`progress-ring__circle ${downloadStatus === 'queued' ? 'pulsing' : ''}`}
                cx="20" cy="20" r={radius} 
                fill="none" 
                stroke="var(--accent-primary)" 
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
          </div>
        );
      })()}

      {downloadStatus === 'completed' && (
        <div className="progress-ring">
          <svg className="check-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
      )}

      {downloadStatus === 'error' && (
        <div className="progress-ring">
          <svg className="error-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      )}
      </div>      {showModal && createPortal(
        <div 
          className="song-sidebar-overlay"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="song-sidebar-drawer"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sidebar-header">
              <div className="sidebar-header-title">
                <Sparkles size={16} className="sidebar-sparkle-icon" />
                <span>Song Insights</span>
              </div>
              <button className="sidebar-close-btn" onClick={() => setShowModal(false)} title="Close Sidebar">
                <X size={18} />
              </button>
            </div>

            <div className="sidebar-scroll-content">
              <div className="sidebar-hero">
                <SmartImage 
                  src={song.thumbnail} 
                  videoId={song.videoId || song.id} 
                  alt={song.title} 
                  className="sidebar-hero-img" 
                  size={512} 
                  iconSize={64}
                />
                {isCurrentlyPlaying && (
                  <div className="hover-playing-badge">
                    <div className="equalizer-overlay active">
                      <div className="bar bar1"></div>
                      <div className="bar bar2"></div>
                      <div className="bar bar3"></div>
                    </div>
                    <span>PLAYING</span>
                  </div>
                )}
                {hasLyrics && (
                  <div className="modal-lyrics-badge" title="Live Synced Lyrics Available">
                    <Mic2 size={12} className="badge-icon" />
                    <span>Synced Lyrics</span>
                  </div>
                )}
                <div className="hover-duration-badge">
                  <Clock size={12} className="badge-icon" />
                  {formatDuration(song.duration)}
                </div>
              </div>
              
              <div className="sidebar-meta-section">
                <h2 className="sidebar-title">{song.title}</h2>
                <div className="sidebar-details">
                  <span className="sidebar-detail-item"><Music size={18} /> {song.artist}</span>
                  {song.album && <span className="sidebar-detail-item"><Disc3 size={18} /> {song.album}</span>}
                </div>
              </div>

              {trivia && (
                <div className="hover-modal-trivia-box">
                  <div className="trivia-header">
                    <Sparkles size={13} className="trivia-sparkle" />
                    <span>BEHIND THE SONG</span>
                  </div>
                  <p className="trivia-story">{trivia.story}</p>
                  
                  {trivia.quote && (
                    <div className="trivia-quote-box">
                      <Quote size={14} className="trivia-quote-icon" />
                      <div className="trivia-quote-content">
                        <p className="trivia-quote-text">"{trivia.quote}"</p>
                        {trivia.quoteSource && <span className="trivia-quote-source">— {trivia.quoteSource}</span>}
                      </div>
                    </div>
                  )}

                  {trivia.achievement && (
                    <div className="trivia-feat">
                      <Trophy size={12} className="trivia-trophy" />
                      <span>{trivia.achievement}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="sidebar-footer-actions">
              <button 
                className={`sidebar-action-btn play-btn ${isCurrentlyPlaying ? 'playing' : ''}`}
                onClick={() => {
                  if (onPlay) onPlay(song);
                }}
                title={isCurrentlyPlaying ? 'Now Playing' : 'Play Stream'}
              >
                <Play size={16} fill={isCurrentlyPlaying ? "currentColor" : "none"} />
                <span>{isCurrentlyPlaying ? 'Playing' : 'Play'}</span>
              </button>

              {(!downloadStatus || downloadStatus === 'error') && (
                <button 
                  className="sidebar-action-btn download-btn-modal"
                  onClick={() => {
                    handleDownloadClick();
                  }}
                  title="Download Track"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
              )}

              {downloadStatus === 'completed' && (
                <button className="sidebar-action-btn completed" disabled title="Downloaded">
                  <Check size={16} />
                  <span>Downloaded</span>
                </button>
              )}

              <a 
                href={`https://music.youtube.com/watch?v=${song.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="sidebar-action-btn ytm-btn"
                title="Open in YouTube Music"
              >
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
