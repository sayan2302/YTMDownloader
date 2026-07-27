import express from 'express';
import { getSongTrivia } from '../services/triviaService.js';

const router = express.Router();

router.get('/', (req, res) => {
  const { title, artist } = req.query;

  if (!title && !artist) {
    return res.status(400).json({ error: 'Missing title or artist query parameters' });
  }

  try {
    const trivia = getSongTrivia(title || '', artist || '');
    res.json(trivia);
  } catch (error) {
    console.error('[Trivia Route Error]:', error);
    res.status(500).json({ error: 'Failed to fetch trivia' });
  }
});

export default router;
