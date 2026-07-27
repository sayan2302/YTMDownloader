import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Music, Disc3, Clock, Maximize2, Play, Download, ExternalLink, Hash, Check } from 'lucide-react';
import { getHighResThumbnail } from '../../utils/thumbnail';
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
        <div 
          className="song-thumbnail" 
          onClick={handleThumbnailClick}
          title="Click to view details"
        >
          {song.thumbnail ? (
            <>
              <img src={getHighResThumbnail(song.thumbnail, 400)} alt={song.title} />
              {isCurrentlyPlaying && (
                <div className="equalizer-overlay">
                  <div className="bar bar1"></div>
                  <div className="bar bar2"></div>
                  <div className="bar bar3"></div>
                </div>
              )}
            </>
          ) : (
            <div className="placeholder-thumb">
              <Music size={24} className="placeholder-icon" />
            </div>
          )}
          <div className="thumbnail-hover-hint">
            <Maximize2 size={20} />
          </div>
        </div>
        
        <div className="song-info">
          <h3 className="song-title">{song.title}</h3>
          <p className="song-meta">
            {song.artist} {song.album && `• ${song.album}`} • {formatDuration(song.duration)}
          </p>
        </div>
      </div>

      {(!downloadStatus) && (
        <button 
          ref={buttonRef}
          className="download-btn" 
          onClick={handleDownloadClick} 
          title="Download"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      )}

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
      </div>

      {showModal && modalRect && createPortal(
        <div 
          className="song-hover-modal-overlay"
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            pointerEvents: 'auto',
            zIndex: 99999,
          }}
        >
          <div 
            className="song-hover-modal"
            onClick={(e) => e.stopPropagation()}
            style={getModalStyle()}
          >
            <div className="hover-modal-hero">
              {song.thumbnail ? (
                <img 
                  src={getHighResThumbnail(song.thumbnail, 800)} 
                  alt={song.title} 
                  className="hover-modal-img" 
                  onError={(e) => {
                    const currentSrc = e.target.src;
                    if (currentSrc.includes('maxresdefault.jpg')) {
                      e.target.src = currentSrc.replace('maxresdefault.jpg', 'hqdefault.jpg');
                    } else if (currentSrc !== song.thumbnail) {
                      e.target.src = song.thumbnail;
                    }
                  }}
                />
              ) : (
                <div className="hover-placeholder"><Music size={64} /></div>
              )}
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
              <div className="hover-duration-badge">
                <Clock size={12} className="badge-icon" />
                {formatDuration(song.duration)}
              </div>
            </div>
            
            <div className="hover-modal-content">
              <h2 className="hover-modal-title">{song.title}</h2>
              <div className="hover-modal-details">
                <span className="hover-detail-item"><Music size={18} /> {song.artist}</span>
                {song.album && <span className="hover-detail-item"><Disc3 size={18} /> {song.album}</span>}
              </div>

              <div className="hover-modal-actions">
                <button 
                  className={`modal-action-btn play-btn ${isCurrentlyPlaying ? 'playing' : ''}`}
                  onClick={() => {
                    if (onPlay) onPlay(song);
                    setShowModal(false);
                  }}
                  title={isCurrentlyPlaying ? 'Now Playing' : 'Play Stream'}
                >
                  <Play size={18} fill={isCurrentlyPlaying ? "currentColor" : "none"} />
                </button>

                {!downloadStatus && (
                  <button 
                    className="modal-action-btn download-btn-modal"
                    onClick={() => {
                      handleDownloadClick();
                      setShowModal(false);
                    }}
                    title="Download"
                  >
                    <Download size={18} />
                  </button>
                )}

                {downloadStatus === 'downloading' && (
                  <button className="modal-action-btn download-btn-modal disabled" disabled title={`Downloading ${downloadPercent}`}>
                    <span className="spinner-mini"></span>
                  </button>
                )}

                {downloadStatus === 'queued' && (
                  <button className="modal-action-btn download-btn-modal disabled" disabled title="Queued">
                    <Clock size={18} />
                  </button>
                )}

                {downloadStatus === 'completed' && (
                  <button className="modal-action-btn download-btn-modal completed" disabled title="Downloaded">
                    <Check size={18} />
                  </button>
                )}

                <a 
                  href={`https://music.youtube.com/watch?v=${song.videoId}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="modal-action-btn ytm-btn"
                  title="Open in YouTube Music"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
