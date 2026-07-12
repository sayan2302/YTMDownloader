import express from 'express';
import { getPlaylist } from '../services/ytmusicService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const urlStr = req.body.url;
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
    res.json(playlistData);
  } catch (error) {
    console.error('Playlist route error:', error);
    res.status(500).json({ error: 'Failed to fetch playlist', details: error.message });
  }
});

export default router;
