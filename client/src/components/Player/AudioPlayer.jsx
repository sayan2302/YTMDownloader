import { useEffect, useState } from 'react';
import { Music } from 'lucide-react';
import './AudioPlayer.css';

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function AudioPlayer({ player }) {
  const {
    audioRef,
    currentSong,
    source,
    audioUrl,
    isPlaying,
    currentTime,
    duration: audioDuration,
    volume,
    isPlayerVisible,
    pause,
    resume,
    seek,
    setVolume,
    stop,
    queue,
    playNext,
    playPrevious
  } = player;

  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);

  // Use song duration if audio duration is not available (common for streams)
  const displayDuration = (audioDuration && isFinite(audioDuration)) 
    ? audioDuration 
    : ((currentSong && currentSong.duration) || 0);

  const displayTime = isDragging ? dragTime : currentTime;
  const progressPercent = displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  const handleSeekChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setDragTime(newTime);
  };

  const handleSeekEnd = (e) => {
    setIsDragging(false);
    seek(parseFloat(e.target.value));
  };

  const handleSeekStart = () => {
    setIsDragging(true);
  };

  return (
    <div className={`audio-player liquid-glass ${isPlayerVisible && currentSong ? 'player-enter' : 'player-exit'}`}>
      <audio ref={audioRef} src={audioUrl || undefined} style={{ display: 'none' }} />

      {currentSong && (
        <div className="player-content">
          <div className="player-songinfo">
            {currentSong.thumbnail ? (
              <img src={currentSong.thumbnail} alt="Album Art" className="player-thumb" />
            ) : (
              <div className="player-thumb-placeholder">
                <Music size={24} className="placeholder-icon" />
              </div>
            )}
            <div className="player-meta">
              <h4 className="player-title">{currentSong.title}</h4>
              <p className="player-artist">{currentSong.artist}</p>
            </div>
          </div>

        <div className="player-center">
          <div className="player-controls">
            <button 
              className="player-btn" 
              onClick={playPrevious} 
              disabled={queue.length <= 1}
              title={queue.length <= 1 ? "Previous (No queue)" : "Previous track"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/></svg>
            </button>

            <button 
              className="player-btn play-pause" 
              onClick={isPlaying ? pause : resume}
            >
              {isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <button 
              className="player-btn" 
              onClick={playNext} 
              disabled={queue.length <= 1}
              title={queue.length <= 1 ? "Next (No queue)" : "Next track"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>
          </div>

          <div className="player-seekbar-container">
            <span className="time-display">{formatTime(displayTime)}</span>
            <input 
              type="range" 
              className="player-seekbar"
              min="0"
              max={displayDuration || 100}
              value={displayTime}
              onMouseDown={handleSeekStart}
              onMouseUp={handleSeekEnd}
              onTouchStart={handleSeekStart}
              onTouchEnd={handleSeekEnd}
              onChange={handleSeekChange}
              style={{ '--progress': `${progressPercent}%` }}
              disabled={source === 'stream'} // Streams are usually not forward-seekable reliably via this method
              title={source === 'stream' ? 'Seeking is disabled for live streams' : ''}
            />
            <span className="time-display">{formatTime(displayDuration)}</span>
          </div>
        </div>

        <div className="player-right">
          <div className="player-volume-container">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
            <input 
              type="range" 
              className="player-volume" 
              min="0" 
              max="1" 
              step="0.01" 
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              style={{ '--volume-progress': `${volume * 100}%` }}
            />
          </div>
          
          <button className="player-close" onClick={stop} title="Close Player">
            ✕
          </button>
        </div>
      </div>
    )}
  </div>
  );
}
