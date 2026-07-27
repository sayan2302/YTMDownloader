import { useEffect, useState, useRef } from 'react';
import { X, Mic2, Loader2, Music2 } from 'lucide-react';
import './LyricsView.css';

function parseLyricLine(rawLine) {
  const lrcRegex = /^\[(\d{2}):(\d{2})\.?(\d{2,3})?\]\s*(.*)$/;
  const match = rawLine.match(lrcRegex);

  if (match) {
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2], 10);
    const ms = match[3] ? parseInt(match[3].slice(0, 2), 10) / 100 : 0;
    const timeInSeconds = minutes * 60 + seconds + ms;
    const text = match[4] || '';
    return { time: timeInSeconds, text: text.trim(), isTimed: true };
  }

  return { time: null, text: rawLine.trim(), isTimed: false };
}

export default function LyricsView({ currentSong, currentTime, duration, onSeek, onClose }) {
  const [lyricsData, setLyricsData] = useState({ parsedLines: [], loading: true, error: null, hasTimestamps: false });
  const activeLineRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Fetch lyrics when song changes
  useEffect(() => {
    if (!currentSong?.videoId) return;

    let isMounted = true;
    setLyricsData({ parsedLines: [], loading: true, error: null, hasTimestamps: false });

    fetch(`/api/lyrics/${currentSong.videoId}`)
      .then(res => {
        if (!res.ok) throw new Error('Lyrics not found');
        return res.json();
      })
      .then(data => {
        if (isMounted) {
          const rawLines = data.lines || [];
          const parsed = rawLines.map(parseLyricLine).filter(item => item.text.length > 0);
          const hasTimestamps = parsed.some(item => item.isTimed);

          setLyricsData({ parsedLines: parsed, loading: false, error: null, hasTimestamps });
        }
      })
      .catch(err => {
        if (isMounted) {
          setLyricsData({ parsedLines: [], loading: false, error: err.message, hasTimestamps: false });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentSong?.videoId]);

  // Calculate active center line index
  const { parsedLines, hasTimestamps } = lyricsData;
  let activeIndex = -1;

  if (parsedLines.length > 0) {
    if (hasTimestamps) {
      for (let i = 0; i < parsedLines.length; i++) {
        if (parsedLines[i].time !== null && currentTime >= parsedLines[i].time) {
          activeIndex = i;
        } else if (parsedLines[i].time !== null && currentTime < parsedLines[i].time) {
          break;
        }
      }
    } else if (duration > 0) {
      const introBuffer = duration * 0.05;
      const outroBuffer = duration * 0.92;
      const activeWindow = Math.max(1, outroBuffer - introBuffer);

      if (currentTime < introBuffer) {
        activeIndex = 0;
      } else if (currentTime >= outroBuffer) {
        activeIndex = parsedLines.length - 1;
      } else {
        const vocalProgress = (currentTime - introBuffer) / activeWindow;
        activeIndex = Math.min(parsedLines.length - 1, Math.floor(vocalProgress * parsedLines.length));
      }
    }
  }

  // Smoothly auto-scroll active line into vertical center
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeIndex]);

  const handleLineClick = (index, item) => {
    if (item.isTimed && item.time !== null && typeof onSeek === 'function') {
      onSeek(item.time);
    } else if (duration > 0 && typeof onSeek === 'function') {
      const introBuffer = duration * 0.05;
      const outroBuffer = duration * 0.92;
      const activeWindow = Math.max(1, outroBuffer - introBuffer);
      const estTime = introBuffer + (index / parsedLines.length) * activeWindow;
      onSeek(estTime);
    }
  };

  return (
    <div className="lyrics-view-overlay">
      <div className="lyrics-view-header">
        <div className="lyrics-header-title">
          <Mic2 size={18} className="lyrics-icon" />
          <span>Live Synced Lyrics</span>
        </div>
        <button className="lyrics-close-btn" onClick={onClose} title="Close Lyrics">
          <X size={18} />
        </button>
      </div>

      <div className="lyrics-scroll-container" ref={scrollContainerRef}>
        {lyricsData.loading && (
          <div className="lyrics-status-container">
            <Loader2 size={24} className="lyrics-spinner" />
            <p>Fetching synced lyrics...</p>
          </div>
        )}

        {!lyricsData.loading && lyricsData.error && (
          <div className="lyrics-status-container">
            <Music2 size={32} className="lyrics-empty-icon" />
            <p>Lyrics are unavailable for this track</p>
          </div>
        )}

        {!lyricsData.loading && !lyricsData.error && parsedLines.length > 0 && (
          <div className="lyrics-lines-wrapper">
            {parsedLines.map((item, index) => {
              const distance = Math.abs(index - activeIndex);
              const isActiveCenter = index === activeIndex;
              const isNearFocus = distance === 1;

              let lineClass = 'lyrics-line';
              if (isActiveCenter) {
                lineClass += ' active-center';
              } else if (isNearFocus) {
                lineClass += ' active-near';
              } else if (index < activeIndex) {
                lineClass += ' past';
              }

              return (
                <p
                  key={`${index}-${item.text.slice(0, 10)}`}
                  ref={isActiveCenter ? activeLineRef : null}
                  className={lineClass}
                  onClick={() => handleLineClick(index, item)}
                  title="Click to jump to line"
                >
                  {item.text}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
