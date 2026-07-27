import SongCard from './SongCard';
import { Flame, Search } from 'lucide-react';
import './SearchResults.css';

export default function SearchResults({ results, isLoading, onDownload, onFlyAnimation, downloads, onPlay, currentSong, isDefaultTrending }) {
  if (isLoading) {
    return (
      <div className="search-results">
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
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="empty-state">
        <Search size={48} className="empty-state-icon" />
        <p>No results found</p>
      </div>
    );
  }

  return (
    <div className="search-results-container">
      {isDefaultTrending && (
        <h3 className="trending-title">
          <Flame size={18} className="trending-icon" /> World Trending Hits
        </h3>
      )}
      
      <div className="search-results">
        {results.map((song, i) => {
          const dlEntry = downloads ? Array.from(downloads.values()).find(d => d.videoId === song.videoId) : null;
          return (
            <div 
              key={song.videoId || i} 
              className="stagger-item"
              style={{ animation: 'fadeSlideUp 0.4s ease-out backwards', animationDelay: `${i * 60}ms` }}
            >
              <SongCard 
                song={song} 
                onDownload={onDownload} 
                onFlyAnimation={onFlyAnimation}
                downloadStatus={dlEntry?.status || null}
                downloadPercent={dlEntry?.percent || '0%'}
                onPlay={(songItem, rect, opts) => onPlay(songItem, rect, results, opts)}
                isCurrentlyPlaying={currentSong?.videoId === song.videoId}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
