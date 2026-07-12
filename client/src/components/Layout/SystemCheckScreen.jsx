import { useState } from 'react';
import { Loader2, Terminal, AlertTriangle, RefreshCw, HelpCircle } from 'lucide-react';
import './SystemCheckScreen.css';

export default function SystemCheckScreen({ status, error, onRetry }) {
  const [activeTab, setActiveTab] = useState(() => {
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('win')) return 'windows';
    return 'linux';
  });

  const isDownloading = status === 'downloading' || status === 'checking';

  return (
    <div className="system-check-container">
      <div className="system-check-card liquid-glass">
        {isDownloading ? (
          <div className="status-checking">
            <Loader2 className="spinner checking-spinner" size={60} />
            <h2>Setting Up Dependencies</h2>
            <p className="status-text">
              We are automatically configuring <strong>FFmpeg</strong> and downloading <strong>yt-dlp</strong> from GitHub...
            </p>
            <p className="sub-status-text">This will only happen once on first startup. Please wait.</p>
          </div>
        ) : (
          <div className="status-failed">
            <AlertTriangle className="error-icon" size={60} />
            <h2>System Dependencies Missing</h2>
            <p className="error-summary">
              The automated setup failed to configure the required tools on your machine.
            </p>
            {error && <div className="detailed-error-box">Error details: {error}</div>}

            <div className="setup-tabs">
              <button 
                className={`tab-btn ${activeTab === 'mac' ? 'active' : ''}`}
                onClick={() => setActiveTab('mac')}
              >
                macOS
              </button>
              <button 
                className={`tab-btn ${activeTab === 'windows' ? 'active' : ''}`}
                onClick={() => setActiveTab('windows')}
              >
                Windows
              </button>
              <button 
                className={`tab-btn ${activeTab === 'linux' ? 'active' : ''}`}
                onClick={() => setActiveTab('linux')}
              >
                Linux
              </button>
            </div>

            <div className="setup-guide-content">
              {activeTab === 'mac' && (
                <div className="guide-tab-panel">
                  <p>Open your terminal and paste this command to install the required packages via Homebrew:</p>
                  <div className="code-block-container">
                    <Terminal size={14} className="code-icon" />
                    <code>brew install yt-dlp ffmpeg</code>
                  </div>
                  <p className="guide-footer-text">Don't have Homebrew? Install it from <a href="https://brew.sh" target="_blank" rel="noreferrer">brew.sh</a> first.</p>
                </div>
              )}

              {activeTab === 'windows' && (
                <div className="guide-tab-panel">
                  <p>1. Open Command Prompt/PowerShell and install <strong>yt-dlp</strong>:</p>
                  <div className="code-block-container">
                    <Terminal size={14} className="code-icon" />
                    <code>winget install yt-dlp</code>
                  </div>
                  <p>2. Download <strong>FFmpeg</strong> from the official website and add it to your System PATH:</p>
                  <a 
                    href="https://github.com/BtbN/FFmpeg-Builds/releases" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="ffmpeg-download-link"
                  >
                    Get FFmpeg Builds for Windows
                  </a>
                </div>
              )}

              {activeTab === 'linux' && (
                <div className="guide-tab-panel">
                  <p>Run the package manager command to install both tools:</p>
                  <div className="code-block-container">
                    <Terminal size={14} className="code-icon" />
                    <code>sudo apt update && sudo apt install -y ffmpeg yt-dlp</code>
                  </div>
                  <p className="guide-footer-text">For Fedora/RedHat: <code>sudo dnf install ffmpeg yt-dlp</code></p>
                </div>
              )}
            </div>

            <div className="action-row">
              <button className="btn-retry" onClick={onRetry}>
                <RefreshCw size={16} /> Check Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
