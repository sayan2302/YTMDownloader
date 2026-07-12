import { useState } from 'react';
import { Link, Loader2 } from 'lucide-react';
import './PlaylistInput.css';

export default function PlaylistInput({ onFetch, isLoading }) {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.includes('list=')) {
      setValidationError('Invalid URL. It must contain a "list=" parameter.');
      return;
    }
    setValidationError('');
    onFetch(url);
  };

  return (
    <div className="playlist-input-container">
      <form className="playlist-form liquid-glass" onSubmit={handleSubmit}>
        {isLoading ? (
          <Loader2 size={20} className="playlist-icon spinner" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
        ) : (
          <Link size={20} className="playlist-icon" />
        )}
        <input
          type="text"
          className="playlist-input"
          placeholder="Paste a YouTube Music playlist URL..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        <button type="submit" className="playlist-fetch-btn" disabled={isLoading}>
          {isLoading ? 'Fetching...' : 'Fetch Playlist'}
        </button>
      </form>
      {validationError && (
        <p className="validation-error">{validationError}</p>
      )}
    </div>
  );
}
