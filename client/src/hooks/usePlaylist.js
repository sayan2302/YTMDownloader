import { useState, useCallback } from 'react';

export function usePlaylist() {
  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPlaylist = useCallback(async (url, outputDir) => {
    if (!url) {
      setPlaylist(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, outputDir })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch playlist');
      }

      const data = await res.json();
      setPlaylist(data);
    } catch (err) {
      setError(err.message);
      setPlaylist(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeTrack = useCallback((videoId) => {
    setPlaylist(prev => {
      if (!prev) return null;
      const updatedTracks = prev.tracks.filter(t => t.videoId !== videoId);
      return {
        ...prev,
        trackCount: updatedTracks.length,
        tracks: updatedTracks
      };
    });
  }, []);

  return { playlist, isLoading, error, fetchPlaylist, removeTrack };
}
