import { useState, useRef, useEffect, useCallback } from 'react';

export function usePlayer() {
  const [currentSong, setCurrentSong] = useState(null);
  const [source, setSource] = useState(null); // 'stream' | 'local'
  const [audioUrl, setAudioUrl] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isPlayerVisible, setIsPlayerVisible] = useState(false);
  const [queue, setQueue] = useState([]);
  
  const audioRef = useRef(null);
  const onTrackEndedRef = useRef(null);

  // playNext definition
  const playNext = useCallback(() => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(item => item.videoId === currentSong?.videoId);
    if (currentIndex === -1) return;
    
    const nextIndex = (currentIndex + 1) % queue.length;
    const nextSong = queue[nextIndex];
    
    const isLocal = !!(nextSong.filePath || nextSong.status === 'completed');
    const filePath = nextSong.filePath;
    
    play(nextSong, isLocal ? 'local' : 'stream', queue, filePath);
  }, [queue, currentSong]);

  const playPrevious = useCallback(() => {
    if (queue.length === 0) return;
    const currentIndex = queue.findIndex(item => item.videoId === currentSong?.videoId);
    if (currentIndex === -1) return;
    
    const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
    const prevSong = queue[prevIndex];
    
    const isLocal = !!(prevSong.filePath || prevSong.status === 'completed');
    const filePath = prevSong.filePath;
    
    play(prevSong, isLocal ? 'local' : 'stream', queue, filePath);
  }, [queue, currentSong]);

  // Keep track-ended reference up-to-date to avoid effect re-binding cycles
  useEffect(() => {
    onTrackEndedRef.current = playNext;
  }, [playNext]);

  // Sync state with audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    
    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onTrackEndedRef.current) {
        onTrackEndedRef.current();
      }
    };
    const handlePause = () => setIsPlaying(false);
    const handlePlay = () => setIsPlaying(true);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('play', handlePlay);

    // Initial check in case metadata loaded before effect binded
    updateDuration();

    // Initial volume
    audio.volume = volume;

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('play', handlePlay);
    };
  }, [audioRef, volume, audioUrl]);

  const play = useCallback((song, srcType, queueList = [], localFilePath = null) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }

    setCurrentSong(song);
    setSource(srcType);
    setQueue(queueList);
    setIsPlayerVisible(true);
    setCurrentTime(0);
    setDuration(0);

    let newUrl = '';
    if (srcType === 'stream') {
      newUrl = `/api/stream/${song.videoId}`;
    } else if (srcType === 'local' && localFilePath) {
      newUrl = `/api/play-local?path=${encodeURIComponent(localFilePath)}`;
    }

    setAudioUrl(newUrl);

    // When URL changes, React will re-render the <audio src={newUrl}>
    // We need to wait for the DOM to update before calling play()
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.play().catch(err => console.error("Auto-play prevented", err));
      }
    }, 50);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  }, []);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setVolume = useCallback((v) => {
    if (audioRef.current) {
      audioRef.current.volume = v;
    }
    setVolumeState(v);
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      // Remove src to abort stream
      audioRef.current.removeAttribute('src');
      audioRef.current.load();
    }
    setCurrentSong(null);
    setAudioUrl(null);
    setQueue([]);
    setIsPlayerVisible(false);
    setIsPlaying(false);
  }, []);

  return {
    audioRef,
    currentSong,
    source,
    audioUrl,
    isPlaying,
    currentTime,
    duration,
    volume,
    isPlayerVisible,
    queue,
    playNext,
    playPrevious,
    play,
    pause,
    resume,
    seek,
    setVolume,
    stop
  };
}
