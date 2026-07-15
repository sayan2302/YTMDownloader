import { useState, useEffect, useCallback } from 'react';

export function useDownload() {
  const [downloads, setDownloads] = useState(new Map());

  // Connect to SSE stream
  useEffect(() => {
    const eventSource = new EventSource('/api/download/progress');

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'INITIAL') {
          setDownloads(new Map(payload.data));
        } else if (payload.type === 'DELTA') {
          setDownloads(prev => {
            const next = new Map(prev);
            for (const [id, update] of payload.data) {
              const existing = next.get(id) || {};
              next.set(id, { ...existing, ...update });
            }
            return next;
          });
        }
      } catch (err) {
        console.error('Failed to parse SSE data', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const syncDownloads = useCallback(async (dir) => {
    const dirToUse = dir || localStorage.getItem('ytmd_output_dir');
    if (!dirToUse) return;
    try {
      await fetch('/api/download/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputDir: dirToUse })
      });
    } catch (err) {
      console.error('Failed to sync downloads:', err);
    }
  }, []);

  useEffect(() => {
    const savedDir = localStorage.getItem('ytmd_output_dir');
    if (savedDir) {
      syncDownloads(savedDir);
    }
  }, [syncDownloads]);

  const startDownload = useCallback(async (song, outputDir) => {
    try {
      const downloadLyrics = localStorage.getItem('ytmd_download_lyrics') !== 'false';
      const audioFormat = localStorage.getItem('ytmd_audio_format') || 'm4a';
      const res = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId: song.videoId,
          title: song.title,
          artist: song.artist,
          album: song.album,
          thumbnail: song.thumbnail,
          outputDir,
          downloadLyrics,
          audioFormat
        })
      });

      if (!res.ok) {
        throw new Error('Failed to start download');
      }
      
      const data = await res.json();
      return data.downloadId;
    } catch (err) {
      console.error('Download trigger error:', err);
      alert(`Failed to start download: ${err.message}`);
    }
  }, []);

  const startBulkDownload = useCallback(async (songs, outputDir) => {
    try {
      const downloadLyrics = localStorage.getItem('ytmd_download_lyrics') !== 'false';
      const audioFormat = localStorage.getItem('ytmd_audio_format') || 'm4a';
      const res = await fetch('/api/download/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songs: songs.map(s => ({
            videoId: s.videoId,
            title: s.title,
            artist: s.artist,
            album: s.album,
            thumbnail: s.thumbnail
          })),
          outputDir,
          downloadLyrics,
          audioFormat
        })
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start bulk download');
      }
    } catch (err) {
      console.error('Bulk download error:', err);
      alert(`Failed to start bulk download: ${err.message}`);
    }
  }, []);

  const clearQueue = useCallback(async () => {
    try {
      await fetch('/api/download/clear-queue', { method: 'POST' });
    } catch (err) {
      console.error('Failed to clear queue:', err);
    }
  }, []);

  return { downloads, startDownload, startBulkDownload, clearQueue, syncDownloads };
}
