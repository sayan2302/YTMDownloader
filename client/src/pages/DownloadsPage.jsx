import DownloadItem from '../components/Download/DownloadItem';
import { DownloadCloud } from 'lucide-react';
import './DownloadsPage.css';

export default function DownloadsPage({ downloads, onPlay, currentSong, onSearchAlternative, onClearQueue, onRetry }) {
  const downloadArray = downloads ? Array.from(downloads.values()).reverse() : [];
  const activeDownloads = downloadArray.filter(d => d.status === 'queued' || d.status === 'downloading');
  // UI Freeze Protection: Cap rendered completed downloads to the most recent 50
  const historyDownloads = downloadArray.filter(d => d.status === 'completed' || d.status === 'error').slice(0, 50);

  if (downloadArray.length === 0) {
    return (
      <div className="downloads-page">
        <div className="empty-state">
          <DownloadCloud size={48} className="empty-state-icon" />
          <p>No downloads yet</p>
        </div>
      </div>
    );
  }

  const queuedCount = activeDownloads.filter(d => d.status === 'queued').length;

  return (
    <div className="downloads-page">
      {activeDownloads.length > 0 && (
        <section className="downloads-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 className="section-title" style={{ margin: 0 }}>Active Downloads</h3>
            {queuedCount > 0 && (
              <button 
                onClick={onClearQueue}
                style={{
                  background: 'rgba(255, 59, 48, 0.2)',
                  color: '#ff3b30',
                  border: '1px solid rgba(255, 59, 48, 0.4)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                Clear Pending Queue ({queuedCount})
              </button>
            )}
          </div>
          <div className="downloads-list">
            {activeDownloads.map(dl => (
              <DownloadItem 
                key={dl.downloadId} 
                download={dl} 
                onPlay={onPlay} 
                isCurrentlyPlaying={currentSong?.videoId === dl.videoId} 
                onSearchAlternative={onSearchAlternative}
                onRetry={onRetry}
              />
            ))}
          </div>
        </section>
      )}

      {historyDownloads.length > 0 && (
        <section className="downloads-section history-section">
          <h3 className="section-title">Download History</h3>
          <div className="downloads-list">
            {historyDownloads.map(dl => (
              <DownloadItem 
                key={dl.downloadId} 
                download={dl} 
                onPlay={(song, rect) => onPlay(dl, rect, historyDownloads)} 
                isCurrentlyPlaying={currentSong?.videoId === dl.videoId} 
                onSearchAlternative={onSearchAlternative}
                onRetry={onRetry}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
