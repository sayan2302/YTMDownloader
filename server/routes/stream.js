import express from 'express';
import { spawn } from 'child_process';
import { YTDLP_PATH } from '../utils/dependencyChecker.js';

const router = express.Router();

router.get('/:videoId', (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  res.setHeader('Content-Type', 'audio/mp4');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-store');

  const args = [
    '--no-check-certificates',
    '--extractor-args', 'youtube:player_client=android,web,tv',
    '-f', 'ba/b/best',
    '--no-playlist',
    '-o', '-',
    `https://music.youtube.com/watch?v=${videoId}`
  ];

  const proc = spawn(YTDLP_PATH, args);

  proc.stdout.pipe(res);

  proc.stderr.on('data', (data) => {
    // Only log errors, ignore warnings
    const msg = data.toString();
    if (msg.includes('ERROR:')) {
      console.error(`[yt-dlp stream error] ${msg}`);
    }
  });

  req.on('close', () => {
    if (proc && !proc.killed) {
      proc.kill('SIGINT');
    }
  });

  proc.on('error', (err) => {
    console.error('Failed to start yt-dlp process:', err);
    if (!res.headersSent) {
      res.status(500).end('Internal Server Error');
    }
  });
});

export default router;
