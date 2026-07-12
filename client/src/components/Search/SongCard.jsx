import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Music, Disc3, Clock, Maximize2 } from 'lucide-react';
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
              <img src={song.thumbnail} alt={song.title} />
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
            className="song-hover-modal liquid-glass"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: `${modalRect.top + modalRect.height / 2}px`,
              left: `${modalRect.left + modalRect.width / 2}px`,
              width: `${Math.max(350, modalRect.width * 1.15)}px`,
              transform: 'translate(-50%, -50%) scale(1)'
            }}
          >
            <div className="hover-modal-hero">
              {song.thumbnail ? (
                <img src={song.thumbnail.replace('w120-h120', 'w480-h480')} alt={song.title} className="hover-modal-img" />
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
            </div>
            
            <div className="hover-modal-content">
              <h2 className="hover-modal-title">{song.title}</h2>
              <div className="hover-modal-details">
                <span className="hover-detail-item"><Music size={14} /> {song.artist}</span>
                {song.album && <span className="hover-detail-item"><Disc3 size={14} /> {song.album}</span>}
                <span className="hover-detail-item"><Clock size={14} /> {formatDuration(song.duration)}</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
