import { useSearch } from '../hooks/useSearch';
import { useEffect, useState, useCallback } from 'react';
import SearchBar from '../components/Search/SearchBar';
import SearchResults from '../components/Search/SearchResults';

export default function SearchPage({ outputDir, onDownload, onFlyAnimation, downloads, onPlay, currentSong, searchQueryPreset, onClearPreset }) {
  const { results, isLoading, error, search } = useSearch();
  const [isDefaultTrending, setIsDefaultTrending] = useState(true);

  // Load world top trending English songs by default on mount
  useEffect(() => {
    search('Trending English Songs');
  }, [search]);

  // Sync state if searchQueryPreset is injected
  useEffect(() => {
    if (searchQueryPreset) {
      setIsDefaultTrending(false);
    }
  }, [searchQueryPreset]);

  const handleDownload = (song) => {
    onDownload(song, outputDir);
  };

  const handleSearch = useCallback((query) => {
    if (!query.trim()) {
      setIsDefaultTrending(true);
      search('Trending English Songs');
    } else {
      setIsDefaultTrending(false);
      search(query);
    }
  }, [search]);

  return (
    <div className="search-page">
      <SearchBar 
        onSearch={handleSearch} 
        searchQueryPreset={searchQueryPreset}
        onClearPreset={onClearPreset}
        isLoading={isLoading}
      />
      
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      <SearchResults 
        results={results} 
        isLoading={isLoading} 
        onDownload={handleDownload}
        onFlyAnimation={onFlyAnimation}
        downloads={downloads}
        onPlay={onPlay}
        currentSong={currentSong}
        isDefaultTrending={isDefaultTrending}
      />
    </div>
  );
}
