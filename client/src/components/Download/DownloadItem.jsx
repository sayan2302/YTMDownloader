import { Music, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import './DownloadItem.css';

export default function DownloadItem({ download, onPlay, isCurrentlyPlaying, onSearchAlternative, onRetry }) {
  const { title, artist, album, thumbnail, status, percent, speed, eta, error } = download;

  const isClickable = status === 'completed';

  return (
    <div 
      className={`download-item liquid-glass ${status} ${isClickable ? 'clickable' : ''} ${isCurrentlyPlaying ? 'playing' : ''}`}
      onClick={(e) => {
        if (isClickable && onPlay) {
          const rect = e.currentTarget.getBoundingClientRect();
          // Adjust starting rect to represent a smaller thumbnail-like size
          const startRect = {
            top: rect.top + 8,
            left: rect.left + 8,
            width: 56,
            height: 56
          };
          onPlay(download, startRect);
        }
      }}
    >
      <div className="dl-thumbnail">
        {thumbnail ? (
          <>
            <img src={thumbnail} alt={title} />
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
            <Music size={20} className="placeholder-icon" />
          </div>
        )}
      </div>

      <div className="dl-info">
        <div className="dl-title-row">
          <span className="dl-title" title={title}>
            <span className="dl-title-text">{title}</span>
            {isCurrentlyPlaying && (
              <span className="equalizer-inline">
                <span className="bar bar1"></span>
                <span className="bar bar2"></span>
                <span className="bar bar3"></span>
              </span>
            )}
          </span>
        </div>
        
        <span className="dl-meta">
          {artist || 'Unknown Artist'} {album && `• ${album}`}
        </span>
        
        {(status === 'downloading' || status === 'queued') && (
          <div className="dl-progress-container">
            <div className="dl-progress-wrapper">
              <div 
                className="dl-progress-bar" 
                style={{ width: percent || '0%' }}
              />
            </div>
            {status === 'downloading' && (
              <span className="dl-stats">
                {percent} • {speed} • ETA: {eta}
              </span>
            )}
            {status === 'queued' && (
              <span className="dl-stats">Queued...</span>
            )}
          </div>
        )}
        
        {status === 'error' && (
          <div className="dl-error-container">
            <span className="dl-error" title={error}>{error || 'Failed to download'}</span>
            <div className="dl-action-buttons">
              <button 
                className="dl-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onRetry) {
                    onRetry(download);
                  }
                }}
              >
                Retry
              </button>
              <button 
                className="dl-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSearchAlternative) {
                    onSearchAlternative(`${title} ${artist}`);
                  }
                }}
              >
                Search Alternative
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="dl-status-icon-wrapper">
        {status === 'completed' && <CheckCircle2 size={20} className="status-icon completed" />}
        {status === 'error' && <AlertCircle size={20} className="status-icon error" />}
        {status === 'downloading' && <Loader2 size={20} className="status-icon spinner" />}
        {status === 'queued' && <Clock size={20} className="status-icon queued" />}
      </div>
    </div>
  );
}
