import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import './SearchBar.css';

export default function SearchBar({ onSearch, searchQueryPreset, onClearPreset, isLoading }) {
  const [query, setQuery] = useState('');
  const [isFloating, setIsFloating] = useState(false);
  const [countdownActive, setCountdownActive] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync state with search query preset (from Search Alternative redirection)
  useEffect(() => {
    if (searchQueryPreset) {
      setQuery(searchQueryPreset);
      if (onClearPreset) {
        onClearPreset();
      }
    }
  }, [searchQueryPreset, onClearPreset]);

  // Debounce search (3 seconds with visual countdown)
  useEffect(() => {
    if (!query.trim()) {
      setCountdownActive(false);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      return;
    }

    setCountdownActive(true);
    setAnimationTrigger(prev => prev + 1);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      onSearch(query);
      setCountdownActive(false);
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, onSearch]);

  // Capture typing anywhere on page and focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      )) {
        return;
      }

      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key.length !== 1) return; // Only capture single characters

      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Monitor visibility of search bar to make it float
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsFloating(!entry.isIntersecting);
    }, {
      rootMargin: '-70px 0px 0px 0px', // header height is 70px
      threshold: 0
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      onSearch(query);
      setCountdownActive(false);
    }
  };

  return (
    <div ref={containerRef} className="search-bar-wrapper">
      <div className={`search-bar-container liquid-glass ${isFloating ? 'floating' : ''}`}>
        {isLoading ? (
          <Loader2 size={20} className="search-icon spinner-loading" />
        ) : (
          <Search size={20} className="search-icon" />
        )}
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="Type anywhere to search songs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {countdownActive && (
          <div key={animationTrigger} className="search-countdown-flood" />
        )}
      </div>
    </div>
  );
}
