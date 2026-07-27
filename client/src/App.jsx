import { useState, useRef, useCallback, useEffect } from 'react';
import Header from './components/Layout/Header';
import SearchPage from './pages/SearchPage';
import PlaylistPage from './pages/PlaylistPage';
import DownloadsPage from './pages/DownloadsPage';
import SettingsPanel from './components/Settings/SettingsPanel';
import AboutPage from './pages/AboutPage';
import FlyingThumbnail from './components/Download/FlyingThumbnail';
import AudioPlayer from './components/Player/AudioPlayer';
import { useDownload } from './hooks/useDownload';
import { usePlayer } from './hooks/usePlayer';
import SystemCheckScreen from './components/Layout/SystemCheckScreen';

function App() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'search';
  });
  
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const [outputDir, setOutputDir] = useState(() => {
    return localStorage.getItem('ytmd_output_dir') || '';
  });
  const [searchQueryPreset, setSearchQueryPreset] = useState('');
  const { downloads, startDownload, startBulkDownload, clearQueue, syncDownloads } = useDownload();
  const player = usePlayer();

  useEffect(() => {
    if (player.currentSong) {
      const statusIcon = player.isPlaying ? '▶ ' : '⏸ ';
      document.title = `${statusIcon}${player.currentSong.title} - OpenSpot`;
    } else {
      document.title = 'OpenSpot';
    }
  }, [player.currentSong, player.isPlaying]);

  const [systemStatus, setSystemStatus] = useState({ status: 'checking', error: null });
  
  const [flyingItems, setFlyingItems] = useState([]);
  const downloadsTabRef = useRef(null);

  const checkSystem = useCallback(async () => {
    try {
      const res = await fetch('/api/system-check');
      if (res.ok) {
        const data = await res.json();
        setSystemStatus(data);
        if (data.defaultOutputDir && !localStorage.getItem('ytmd_output_dir')) {
          setOutputDir(data.defaultOutputDir);
        }
        if (data.status === 'checking' || data.status === 'downloading') {
          setTimeout(checkSystem, 3000);
        }
      } else {
        setSystemStatus({ status: 'failed', error: 'Server returned error on system check' });
      }
    } catch (err) {
      setSystemStatus({ status: 'failed', error: err.message });
    }
  }, []);

  useEffect(() => {
    checkSystem();
  }, [checkSystem]);

  const handleSaveOutputDir = useCallback((dir) => {
    setOutputDir(dir);
    localStorage.setItem('ytmd_output_dir', dir);
    syncDownloads(dir);
  }, [syncDownloads]);

  const handleSearchAlternative = useCallback((query) => {
    setSearchQueryPreset(query);
    setActiveTab('search');
  }, []);

  const handleFlyAnimation = useCallback(({ thumbnailSrc, startRect }) => {
    if (!downloadsTabRef.current) return;
    const endRect = downloadsTabRef.current.getBoundingClientRect();
    
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      thumbnailSrc,
      startRect,
      endRect
    };
    
    setFlyingItems(prev => [...prev, newItem]);
  }, []);

  const handleFlyComplete = useCallback((id) => {
    setFlyingItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const handlePlayLocal = useCallback((download, startRect, queue = [], options = {}) => {
    if (download.filePath) {
      // Create a song-like object from download for the player
      const songData = {
        videoId: download.videoId,
        title: download.title,
        artist: download.artist,
        album: download.album,
        thumbnail: download.thumbnail,
        filePath: download.filePath
      };
      player.play(songData, 'local', queue, download.filePath, options);
      
      if (startRect) {
        setTimeout(() => {
          const targetEl = document.querySelector('.player-thumb') || document.querySelector('.player-thumb-placeholder');
          const endRect = targetEl 
            ? targetEl.getBoundingClientRect() 
            : { left: 24, top: window.innerHeight - 73, width: 56, height: 56 };
            
          setFlyingItems(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            thumbnailSrc: download.thumbnail,
            startRect,
            endRect
          }]);
        }, 50);
      }
    } else {
      alert("File path is missing. Cannot play local file.");
    }
  }, [player]);

  const handlePlayStream = useCallback((song, startRect, queue = [], options = {}) => {
    const dl = Array.from(downloads.values()).find(d => d.videoId === song.videoId && d.status === 'completed');
    if (dl && dl.filePath) {
      handlePlayLocal(dl, startRect, queue, options);
      return;
    }

    player.play(song, 'stream', queue, null, options);
    if (startRect) {
      setTimeout(() => {
        const targetEl = document.querySelector('.player-thumb') || document.querySelector('.player-thumb-placeholder');
        const endRect = targetEl 
          ? targetEl.getBoundingClientRect() 
          : { left: 24, top: window.innerHeight - 73, width: 56, height: 56 };
          
        setFlyingItems(prev => [...prev, {
          id: Math.random().toString(36).substr(2, 9),
          thumbnailSrc: song.thumbnail,
          startRect,
          endRect
        }]);
      }, 50);
    }
  }, [player, downloads, handlePlayLocal]);

  const activeDownloadCount = Array.from(downloads.values()).filter(
    d => d.status === 'queued' || d.status === 'downloading'
  ).length;

  if (systemStatus.status !== 'ready') {
    return (
      <SystemCheckScreen 
        status={systemStatus.status} 
        error={systemStatus.error} 
        onRetry={() => {
          setSystemStatus({ status: 'checking', error: null });
          checkSystem();
        }}
      />
    );
  }

  return (
    <div className="app">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        activeDownloadCount={activeDownloadCount}
        downloadsTabRef={downloadsTabRef}
      />
      
      <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', paddingBottom: player.isPlayerVisible ? '120px' : '2rem' }}>
        <div style={{ display: activeTab === 'search' ? 'block' : 'none' }}>
          <SearchPage 
            outputDir={outputDir} 
            onDownload={startDownload} 
            onFlyAnimation={handleFlyAnimation} 
            downloads={downloads} 
            onPlay={handlePlayStream} 
            currentSong={player.currentSong} 
            searchQueryPreset={searchQueryPreset}
            onClearPreset={() => setSearchQueryPreset('')}
          />
        </div>
        <div style={{ display: activeTab === 'playlist' ? 'block' : 'none' }}>
          <PlaylistPage outputDir={outputDir} onDownloadSingle={startDownload} onBulkDownload={startBulkDownload} onFlyAnimation={handleFlyAnimation} downloads={downloads} onPlay={handlePlayStream} currentSong={player.currentSong} />
        </div>
        <div style={{ display: activeTab === 'downloads' ? 'block' : 'none' }}>
          <DownloadsPage 
            downloads={downloads} 
            onPlay={handlePlayLocal} 
            currentSong={player.currentSong} 
            onSearchAlternative={handleSearchAlternative}
            onClearQueue={clearQueue}
            onRetry={(dl) => startDownload(dl, outputDir)}
          />
        </div>
        <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <SettingsPanel outputDir={outputDir} onSave={handleSaveOutputDir} />
        </div>
        <div style={{ display: activeTab === 'about' ? 'block' : 'none' }}>
          <AboutPage systemStatus={systemStatus} />
        </div>
      </main>
      
      {flyingItems.map(item => (
        <FlyingThumbnail
          key={item.id}
          id={item.id}
          thumbnailSrc={item.thumbnailSrc}
          startRect={item.startRect}
          endRect={item.endRect}
          onComplete={handleFlyComplete}
        />
      ))}

      <AudioPlayer player={player} />
    </div>
  );
}

export default App;
