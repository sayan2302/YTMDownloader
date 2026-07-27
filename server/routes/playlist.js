import express from 'express';
import fs from 'fs';
import path from 'path';
import { getPlaylist } from '../services/ytmusicService.js';
import { syncDownloadDirectory } from './download.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { url: urlStr, outputDir } = req.body;
  if (!urlStr) {
    return res.status(400).json({ error: 'Missing playlist URL' });
  }

  try {
    const parsedUrl = new URL(urlStr);
    const playlistId = parsedUrl.searchParams.get('list');
    
    if (!playlistId) {
      return res.status(400).json({ error: 'Invalid playlist URL. Must contain a "list=" parameter.' });
    }

    const playlistData = await getPlaylist(playlistId);

    if (outputDir) {
      // Sync first to update downloadsMap and notify client
      try {
        syncDownloadDirectory(outputDir);
      } catch (err) {
        console.error('[Playlist Sync] Failed to sync download directory:', err);
      }

      // Mark tracks as downloaded if files exist on disk
      playlistData.tracks = playlistData.tracks.map(track => {
        const sanitizedTitle = track.title.replace(/[\\/:*?"<>|]/g, '_');
        const mp3Path = path.join(outputDir, `${sanitizedTitle}.mp3`);
        const m4aPath = path.join(outputDir, `${sanitizedTitle}.m4a`);
        const exists = fs.existsSync(mp3Path) || fs.existsSync(m4aPath);
        return {
          ...track,
          downloaded: exists
        };
      });

      // Sort: not downloaded first (false comes before true)
      playlistData.tracks.sort((a, b) => {
        if (a.downloaded && !b.downloaded) return 1;
        if (!a.downloaded && b.downloaded) return -1;
        return 0;
      });
    }

    res.json(playlistData);
  } catch (error) {
    console.error('Playlist route error:', error);
    res.status(500).json({ error: 'Failed to fetch playlist', details: error.message });
  }
});

export default router;
