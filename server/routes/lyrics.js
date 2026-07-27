import express from 'express';
import { getLyricsText } from '../services/ytmusicService.js';

const router = express.Router();
const lyricsCache = new Map();

// Quick availability check route
router.get('/check/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.json({ videoId, hasLyrics: false });
  }

  if (lyricsCache.has(videoId)) {
    const cached = lyricsCache.get(videoId);
    return res.json({ videoId, hasLyrics: Boolean(cached) });
  }

  try {
    const rawLyrics = await getLyricsText(videoId);
    const hasLyrics = Boolean(rawLyrics && rawLyrics.trim().length > 0);
    lyricsCache.set(videoId, hasLyrics ? rawLyrics : null);
    res.json({ videoId, hasLyrics });
  } catch (error) {
    lyricsCache.set(videoId, null);
    res.json({ videoId, hasLyrics: false });
  }
});

// Full lyrics fetch route
router.get('/:videoId', async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  try {
    let rawLyrics = lyricsCache.get(videoId);
    
    if (rawLyrics === undefined) {
      rawLyrics = await getLyricsText(videoId);
      lyricsCache.set(videoId, rawLyrics || null);
    }

    if (!rawLyrics) {
      return res.status(404).json({ error: 'Lyrics not available for this track' });
    }

    const lines = rawLyrics
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    res.json({
      videoId,
      lyrics: rawLyrics,
      lines
    });
  } catch (error) {
    console.error(`[Lyrics Route Error] Failed for ${videoId}:`, error);
    res.status(500).json({ error: 'Failed to fetch lyrics', details: error.message });
  }
});

export default router;
