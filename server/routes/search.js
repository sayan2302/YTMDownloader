import express from 'express';
import { searchSongs } from '../services/ytmusicService.js';

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

export default router;
