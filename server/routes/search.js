import express from 'express';
import { searchSongs, getUpNextSongs } from '../services/ytmusicService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    const results = await searchSongs(query);
    res.json({ results });
  } catch (error) {
    console.error('Search route error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

router.get('/up-next/:videoId', async (req, res) => {
  const { videoId } = req.params;
  try {
    const results = await getUpNextSongs(videoId);
    res.json({ results });
  } catch (error) {
    console.error('Up next route error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations', details: error.message });
  }
});

export default router;
