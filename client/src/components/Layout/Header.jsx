import { Search, Music, Download, Settings, Info } from 'lucide-react';
import './Header.css';

export default function Header({ activeTab, onTabChange, activeDownloadCount = 0, downloadsTabRef }) {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h2>Open<span>Spot</span></h2>
        </div>
        
        <nav className="tab-nav">
          <button 
            className={`tab-btn ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => onTabChange('search')}
          >
            <Search size={18} className="tab-icon" />
            <span>Search</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'playlist' ? 'active' : ''}`}
            onClick={() => onTabChange('playlist')}
          >
            <Music size={18} className="tab-icon" />
            <span>Playlist</span>
          </button>
          <button 
            ref={downloadsTabRef}
            className={`tab-btn ${activeTab === 'downloads' ? 'active' : ''}`}
            onClick={() => onTabChange('downloads')}
          >
            <Download size={18} className="tab-icon" />
            <span>Downloads</span>
            {activeDownloadCount > 0 && (
              <span className="tab-badge">{activeDownloadCount}</span>
            )}
          </button>
          <button 
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => onTabChange('settings')}
          >
            <Settings size={18} className="tab-icon" />
            <span>Settings</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => onTabChange('about')}
          >
            <Info size={18} className="tab-icon" />
            <span>About</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
