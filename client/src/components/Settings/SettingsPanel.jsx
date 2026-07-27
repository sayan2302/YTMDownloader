import { useState, useRef } from 'react';
import { Settings, FolderOpen, ExternalLink, Check, Trash2, Info } from 'lucide-react';
import './SettingsPanel.css';

export default function SettingsPanel({ outputDir, onSave }) {
  const [dir, setDir] = useState(outputDir);
  const [downloadLyrics, setDownloadLyrics] = useState(() => {
    return localStorage.getItem('ytmd_download_lyrics') !== 'false';
  });
  const [audioFormat, setAudioFormat] = useState(() => {
    return localStorage.getItem('ytmd_audio_format') || 'm4a';
  });
  const [isBrowsing, setIsBrowsing] = useState(false);
  const [isOpenLoading, setIsOpenLoading] = useState(false);
  const [showSavedMsg, setShowSavedMsg] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearedMsg, setShowClearedMsg] = useState(false);
  const savedMsgTimeoutRef = useRef(null);

  const triggerSavedIndicator = () => {
    if (savedMsgTimeoutRef.current) {
      clearTimeout(savedMsgTimeoutRef.current);
    }
    setShowSavedMsg(true);
    savedMsgTimeoutRef.current = setTimeout(() => {
      setShowSavedMsg(false);
    }, 1500);
  };

  const handleBrowse = async () => {
    setIsBrowsing(true);
    try {
      const res = await fetch('/api/browse');
      const data = await res.json();
      if (res.ok && data.path) {
        setDir(data.path);
        onSave(data.path);
        triggerSavedIndicator();
      } else if (data.error && !data.error.includes('cancelled')) {
        alert(data.error);
      }
    } catch (err) {
      console.error('Failed to browse for folder', err);
    } finally {
      setIsBrowsing(false);
    }
  };

  const handleOpenFolder = async () => {
    const targetPath = dir || outputDir || '';
    setIsOpenLoading(true);
    try {
      const res = await fetch('/api/browse/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: targetPath })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to open folder');
      }
    } catch (err) {
      console.error('Failed to open folder:', err);
      alert('Failed to connect to server');
    } finally {
      setIsOpenLoading(false);
    }
  };

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      const res = await fetch('/api/download/clear-cache', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to clear cache');
      setShowClearedMsg(true);
      setTimeout(() => {
        setShowClearedMsg(false);
      }, 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setIsClearing(false);
    }
  };

  const handleInputChange = (e) => {
    setDir(e.target.value);
  };

  const handleInputBlur = () => {
    if (dir !== outputDir) {
      onSave(dir);
      triggerSavedIndicator();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.target.blur();
    }
  };

  return (
    <div className="settings-tab-container">
      <div className="settings-card liquid-glass" style={{ position: 'relative' }}>
        <span className={`saved-success-msg ${showSavedMsg ? 'visible' : ''}`}>
          <Check size={16} /> Auto-saved
        </span>
        
        <div className="settings-form">
          <div className="form-group">
            <label htmlFor="outputDir" className="label-with-info">
              Download Directory
              <div className="tooltip-container">
                <Info size={14} className="info-icon" />
                <span className="tooltip-text">Select where your downloaded FLAC / lossy files will be saved on your system.</span>
              </div>
            </label>
            <div className="input-with-button">
              <input
                id="outputDir"
                type="text"
                value={dir}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder="/Users/sayan/Desktop"
              />
              <button 
                type="button" 
                className="btn-open-folder" 
                onClick={handleOpenFolder}
                disabled={isOpenLoading || !dir}
                title="Open folder in Finder (macOS) / File Explorer (Windows) / File Manager"
              >
                {isOpenLoading ? '...' : <ExternalLink size={18} />}
              </button>
              <button 
                type="button" 
                className="btn-browse" 
                onClick={handleBrowse}
                disabled={isBrowsing}
                title="Browse directory picker"
              >
                {isBrowsing ? '...' : <FolderOpen size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group toggle-group">
            <div className="toggle-row">
              <span className="toggle-label-text label-with-info">
                Audio Format
                <div className="tooltip-container">
                  <Info size={14} className="info-icon" />
                  <span className="tooltip-text">Select your preferred audio format (M4A or MP3). M4A is the native YouTube Music format and downloads faster.</span>
                </div>
              </span>
              <select
                className="format-select"
                value={audioFormat}
                onChange={e => {
                  const val = e.target.value;
                  setAudioFormat(val);
                  localStorage.setItem('ytmd_audio_format', val);
                  triggerSavedIndicator();
                }}
                style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', padding: '6px 12px', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                <option value="m4a" style={{ background: '#111' }}>M4A</option>
                <option value="mp3" style={{ background: '#111' }}>MP3</option>
              </select>
            </div>

            <div className="toggle-row" style={{ marginTop: '1.5rem' }}>
              <span className="toggle-label-text label-with-info">
                Download & Embed Lyrics
                <div className="tooltip-container">
                  <Info size={14} className="info-icon" />
                  <span className="tooltip-text">Fetches lyrics from YouTube Music and embeds them into metadata tags inside the audio track.</span>
                </div>
              </span>
              <label className="toggle-switch">
                <input
                  id="downloadLyrics"
                  type="checkbox"
                  checked={downloadLyrics}
                  onChange={e => {
                    const val = e.target.checked;
                    setDownloadLyrics(val);
                    localStorage.setItem('ytmd_download_lyrics', val ? 'true' : 'false');
                    triggerSavedIndicator();
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div className="settings-divider" />

          <div className="form-group cache-group">
            <label className="label-with-info">
              Cache & History
              <div className="tooltip-container">
                <Info size={14} className="info-icon" />
                <span className="tooltip-text">Resets the local YouTube decipher cache (helps fix 403 Forbidden errors) and clears completed or failed items from download history.</span>
              </div>
            </label>
            <div className="cache-action-row">
              <button 
                type="button" 
                className="btn-danger" 
                onClick={handleClearCache}
                disabled={isClearing}
                title="Resets yt-dlp decipher caches and clears completed/failed items from memory"
              >
                <Trash2 size={16} /> {isClearing ? 'Clearing Cache...' : 'Clear Cache & History'}
              </button>
              {showClearedMsg && (
                <span className="cleared-success-msg">
                  <Check size={16} /> Cache cleared!
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
