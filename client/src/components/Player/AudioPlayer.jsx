import { useEffect, useState, useRef } from 'react';
import { Music, Infinity, ListMusic, Trash2, Shuffle, Repeat, Repeat1, Mic2 } from 'lucide-react';
import AudioVisualizer from './AudioVisualizer';
import LyricsView from './LyricsView';
import SmartImage from '../Common/SmartImage';
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
    isLoading,
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
    playPrevious,
    playQueueTrack,
    clearQueue,
    autoplay,
    setAutoplay,
    isShuffle,
    setIsShuffle,
    repeatMode,
    setRepeatMode,
    autoLyricsSignal
  } = player;

  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [thumbError, setThumbError] = useState(false);

  useEffect(() => {
    if (autoLyricsSignal > 0) {
      setShowLyrics(true);
    }
  }, [autoLyricsSignal]);

  useEffect(() => {
    setThumbError(false);
  }, [currentSong?.videoId, currentSong?.thumbnail]);
  
  const activeItemRef = useRef(null);

  const handleRepeatClick = () => {
    if (repeatMode === 'off') {
      setRepeatMode('all');
    } else if (repeatMode === 'all') {
      setRepeatMode('one');
    } else {
      setRepeatMode('off');
    }
  };

  // Scroll active track in queue into view when opening
  useEffect(() => {
    if (showQueue && activeItemRef.current) {
      setTimeout(() => {
        if (activeItemRef.current) {
          activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [showQueue, currentSong]);

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

  const currentIndex = queue.findIndex(item => item.videoId === currentSong?.videoId);
  const nextSong = currentIndex !== -1 && currentIndex < queue.length - 1 ? queue[currentIndex + 1] : null;

  return (
    <div className={`audio-player ${isPlayerVisible && currentSong ? 'player-enter' : 'player-exit'}`}>
      <audio ref={audioRef} src={audioUrl || undefined} crossOrigin="anonymous" style={{ display: 'none' }} />
      {currentSong && isPlaying && !isLoading && <AudioVisualizer audioRef={audioRef} isPlaying={isPlaying} thumbnail={currentSong?.thumbnail} />}

      {currentSong && (
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
          disabled={source === 'stream'} 
          title={source === 'stream' ? 'Seeking is disabled for live streams' : ''}
        />
      )}

      {currentSong && showQueue && (
        <div className="player-queue-panel">
          <div className="queue-header">
            <h3 className="queue-title">Play Queue ({queue.length})</h3>
            <button className="queue-clear-btn" onClick={clearQueue} title="Clear upcoming recommendations">
              <Trash2 size={14} />
              <span>Clear Queue</span>
            </button>
          </div>
          <div className="queue-list">
            {queue.map((item, index) => {
              const isActive = item.videoId === currentSong?.videoId;
              return (
                <div 
                  key={`${item.videoId}-${index}`} 
                  ref={isActive ? activeItemRef : null}
                  className={`queue-item ${isActive ? 'active' : ''}`}
                  onClick={() => playQueueTrack(index)}
                  title={`Play: ${item.title}`}
                >
                  <div className="queue-item-thumb-container">
                    <SmartImage 
                      src={item.thumbnail} 
                      videoId={item.videoId} 
                      alt="" 
                      className="queue-item-thumb" 
                      size={120} 
                      iconSize={14}
                    />
                    {isActive && (
                      <div className="queue-playing-overlay">
                        <div className="equalizer-overlay active">
                          <div className="bar bar1"></div>
                          <div className="bar bar2"></div>
                          <div className="bar bar3"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="queue-item-meta">
                    <div className="queue-item-title">{item.title}</div>
                    <div className="queue-item-artist">{item.artist}</div>
                  </div>
                  <div className="queue-item-duration">
                    {formatTime(item.duration)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentSong && showLyrics && (
        <LyricsView 
          currentSong={currentSong} 
          currentTime={currentTime} 
          duration={displayDuration} 
          onSeek={seek}
          onClose={() => setShowLyrics(false)} 
        />
      )}

      {currentSong && (
        <div className="player-content">
          <div className="player-songinfo">
            <SmartImage 
              src={currentSong.thumbnail} 
              videoId={currentSong.videoId} 
              alt="Album Art" 
              className="player-thumb" 
              size={540} 
              iconSize={24}
            />
            <div className="player-meta">
              <h4 className="player-title">{currentSong.title}</h4>
              <p className="player-artist">{currentSong.artist}</p>
            </div>
            <span className="time-display player-time-display">
              {formatTime(displayTime)} / {formatTime(displayDuration)}
            </span>
          </div>

        <div className="player-center">
          <div className="player-controls">
            <button 
              className={`player-btn player-control-shuffle ${isShuffle ? 'active' : ''}`}
              onClick={() => setIsShuffle(!isShuffle)}
              title={`Shuffle: ${isShuffle ? 'ON' : 'OFF'}`}
            >
              <Shuffle size={16} />
            </button>

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
              onClick={isLoading ? null : (isPlaying ? pause : resume)}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="player-spinner"></div>
              ) : isPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>

            <button 
              className="player-btn" 
              onClick={playNext} 
              disabled={queue.length <= 1 && !autoplay}
              title={queue.length <= 1 && !autoplay ? "Next (No queue)" : "Next track"}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></svg>
            </button>

            <button 
              className={`player-btn player-control-repeat ${repeatMode !== 'off' ? 'active' : ''}`}
              onClick={handleRepeatClick}
              title={`Repeat: ${repeatMode === 'one' ? 'One' : repeatMode === 'all' ? 'All' : 'OFF'}`}
            >
              {repeatMode === 'one' ? <Repeat1 size={16} /> : <Repeat size={16} />}
            </button>
          </div>

          {nextSong && (
            <div className="player-up-next-preview" title="Up Next">
              Up Next: <span className="up-next-title">{nextSong.title}</span> • {nextSong.artist}
            </div>
          )}
        </div>

        <div className="player-right">
          <button 
            className={`player-queue-toggle ${showLyrics ? 'active' : ''}`} 
            onClick={() => setShowLyrics(!showLyrics)}
            title="Live Synced Lyrics"
          >
            <Mic2 size={20} />
          </button>

          <button 
            className={`player-autoplay-btn ${autoplay ? 'active' : ''}`} 
            onClick={() => setAutoplay(!autoplay)}
            title={`Autoplay recommendations: ${autoplay ? 'ON' : 'OFF'}`}
          >
            <Infinity size={20} />
          </button>

          <button 
            className={`player-queue-toggle ${showQueue ? 'active' : ''}`} 
            onClick={() => setShowQueue(!showQueue)}
            title="View play queue"
          >
            <ListMusic size={20} />
          </button>

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
