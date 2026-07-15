import SongCard from '../Search/SongCard';
import { X } from 'lucide-react';
import { useState } from 'react';
import './PlaylistView.css';

export default function PlaylistView({ playlist, isLoading, onDownloadAll, onDownloadSingle, onFlyAnimation, downloads, onPlay, currentSong, onRemoveTrack }) {
  const [removingIds, setRemovingIds] = useState(new Set());

  const handleRemove = (videoId) => {
    setRemovingIds(prev => {
      const next = new Set(prev);
      next.add(videoId);
      return next;
    });

    setTimeout(() => {
      if (onRemoveTrack) {
        onRemoveTrack(videoId);
      }
      setRemovingIds(prev => {
        const next = new Set(prev);
        next.delete(videoId);
        return next;
      });
    }, 350);
  };

  if (isLoading) {
    return (
      <div className="playlist-view">
        <div className="playlist-header skeleton-header" />
        <div className="playlist-tracks">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton-card liquid-glass">
              <div className="skeleton-thumbnail" />
              <div className="skeleton-info">
                <div className="skeleton-line skeleton-title-line" />
                <div className="skeleton-line skeleton-meta-line" />
              </div>
              <div className="skeleton-button" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!playlist) return null;

  const handleDownloadAllClick = () => {
    const remainingTracks = playlist.tracks.filter(song => {
      const dlEntry = downloads ? Array.from(downloads.values()).find(d => d.videoId === song.videoId) : null;
      return !song.downloaded && dlEntry?.status !== 'completed';
    });
    
    if (remainingTracks.length === 0) {
      alert("All tracks are already downloaded!");
      return;
    }
    
    onDownloadAll(remainingTracks);
  };

  return (
    <div className="playlist-view liquid-glass">
      <div className="playlist-header">
        <div className="playlist-info">
          <h2>{playlist.title}</h2>
          <p>{playlist.trackCount} tracks</p>
        </div>
        <button 
          className="download-all-btn" 
          onClick={handleDownloadAllClick}
        >
          ⬇ Download All
        </button>
      </div>

      <div className="playlist-tracks">
        {playlist.tracks.map((song, i) => {
          const dlEntry = downloads ? Array.from(downloads.values()).find(d => d.videoId === song.videoId) : null;
          const isPlaying = currentSong?.videoId === song.videoId;
          const isRemoving = removingIds.has(song.videoId);
          return (
            <div 
              className={`track-card-wrapper stagger-item ${isPlaying ? 'playing' : ''} ${isRemoving ? 'removing' : ''}`}
              key={song.videoId || i}
              style={{ 
                animation: isRemoving
                  ? 'cardExit 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards'
                  : 'fadeSlideUp 0.4s ease-out backwards', 
                animationDelay: isRemoving ? '0ms' : `${i * 40}ms` 
              }}
            >
              <span className="track-number-badge">{i + 1}</span>
              <button 
                className="track-remove-btn"
                onClick={() => handleRemove(song.videoId)}
                title="Remove song from list"
              >
                <X size={12} />
              </button>
              <SongCard 
                song={song} 
                onDownload={onDownloadSingle} 
                onFlyAnimation={onFlyAnimation}
                downloadStatus={dlEntry?.status || (song.downloaded ? 'completed' : null)}
                downloadPercent={dlEntry?.percent || (song.downloaded ? '100%' : '0%')}
                onPlay={(song, rect) => onPlay(song, rect, playlist.tracks)}
                isCurrentlyPlaying={isPlaying}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
