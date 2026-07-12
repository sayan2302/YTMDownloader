import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { downloadTrack } from '../services/downloadService.js';
import { getLyricsText } from '../services/ytmusicService.js';
import { FFMPEG_PATH, YTDLP_PATH } from '../utils/dependencyChecker.js';

const router = express.Router();

const downloadsMap = new Map();
const sseClients = new Set();
const dirtyDownloads = new Set();

// Queue state
let downloadQueue = [];
let activeDownloads = 0;
const MAX_CONCURRENT = 3;
let isQueuePaused = false;
let queueSaveTimeout = null;

const QUEUE_FILE = path.join(process.cwd(), 'queue.json');
const QUEUE_FILE_TEMP = path.join(process.cwd(), 'queue.temp.json');

// ---------------------------------------------------------
// Disk Persistence
// ---------------------------------------------------------
function loadQueueFromDisk() {
  if (fs.existsSync(QUEUE_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf-8'));
      if (Array.isArray(data.downloadsMap)) {
        for (const [id, dl] of data.downloadsMap) {
          // Reset 'downloading' to 'queued' on startup to allow them to retry
          if (dl.status === 'downloading') {
            dl.status = 'queued';
            dl.percent = '0%';
            dl.speed = '';
            dl.eta = '';
          }
          downloadsMap.set(id, dl);
        }
      }
      if (Array.isArray(data.downloadQueue)) {
        downloadQueue = data.downloadQueue;
      }
      console.log(`[Queue] Loaded ${downloadQueue.length} pending tasks and ${downloadsMap.size} map entries from disk.`);
    } catch (err) {
      console.error('[Queue] Failed to load queue.json:', err);
    }
  }
}

function saveQueueToDisk() {
  try {
    const data = {
      downloadsMap: Array.from(downloadsMap.entries()),
      downloadQueue
    };
    fs.writeFileSync(QUEUE_FILE_TEMP, JSON.stringify(data, null, 2));
    fs.renameSync(QUEUE_FILE_TEMP, QUEUE_FILE);
  } catch (err) {
    console.error('[Queue] Failed to save queue to disk:', err);
  }
}

function scheduleSave() {
  if (queueSaveTimeout) clearTimeout(queueSaveTimeout);
  queueSaveTimeout = setTimeout(saveQueueToDisk, 2000);
}

// Load on boot, then start processing immediately just in case
loadQueueFromDisk();
processQueue(); // Kickoff any pending items loaded from disk

// ---------------------------------------------------------
// SSE Delta Streaming
// ---------------------------------------------------------
setInterval(() => {
  if (dirtyDownloads.size > 0 && sseClients.size > 0) {
    const updates = [];
    for (const id of dirtyDownloads) {
      const dl = downloadsMap.get(id);
      if (dl) updates.push([id, dl]);
    }
    const payload = JSON.stringify({ type: 'DELTA', data: updates });
    for (const client of sseClients) {
      client.write(`data: ${payload}\n\n`);
    }
    dirtyDownloads.clear();
  }
}, 500);

function markDirty(downloadId) {
  dirtyDownloads.add(downloadId);
  scheduleSave();
}

// ---------------------------------------------------------
// Queue Processing
// ---------------------------------------------------------
async function processQueue() {
  if (isQueuePaused || activeDownloads >= MAX_CONCURRENT || downloadQueue.length === 0) {
    return;
  }

  activeDownloads++;
  const task = downloadQueue.shift();
  const { downloadId, videoId, title, outputDir, downloadLyrics } = task;

  // Add 1.5s jitter before starting
  await new Promise(resolve => setTimeout(resolve, 1500));

  const onProgress = (progress) => {
    const dl = downloadsMap.get(downloadId);
    if (dl) {
      dl.status = 'downloading';
      dl.percent = progress.percent;
      dl.speed = progress.speed;
      dl.eta = progress.eta;
      markDirty(downloadId);
    }
  };

  const onComplete = async () => {
    const dl = downloadsMap.get(downloadId);
    if (dl) {
      const sanitizedTitle = dl.title.replace(/[\\/:*?"<>|]/g, '_');
      const finalPath = path.join(outputDir, `${sanitizedTitle}.m4a`);
      
      if (downloadLyrics) {
        try {
          const lyricsText = await getLyricsText(videoId);
          if (lyricsText) {
            await embedLyricsToM4A(finalPath, lyricsText);
          }
        } catch (err) {
          console.error(`[Lyrics] Failed to download or embed lyrics for track: ${dl.title}`, err);
        }
      }

      dl.status = 'completed';
      dl.percent = '100%';
      dl.filePath = finalPath;
      markDirty(downloadId);
    }
    activeDownloads--;
    processQueue();
  };

  const onError = (err) => {
    const dl = downloadsMap.get(downloadId);
    if (dl) {
      dl.status = 'error';
      dl.error = err.message;
      markDirty(downloadId);
    }
    activeDownloads--;
    
    // Chain-Reaction Guards
    const msg = err.message || '';
    if (msg.includes('429') || msg.includes('403') || msg.includes('Sign in to confirm')) {
      console.warn(`[Queue] YouTube Rate Limit/Ban detected! Pausing queue for 5 minutes.`);
      isQueuePaused = true;
      setTimeout(() => {
        console.log(`[Queue] Resuming queue after 5 minute pause.`);
        isQueuePaused = false;
        processQueue();
      }, 300000);
    } else if (msg.includes('ENOSPC') || msg.includes('No space left')) {
      console.error(`[Queue] Disk Full (ENOSPC)! Pausing queue indefinitely.`);
      isQueuePaused = true;
    } else {
      processQueue();
    }
  };

  // Pre-flight directory check
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
    } catch (err) {
      onError(new Error(`Failed to create output directory: ${err.message}`));
      return;
    }
  }

  downloadTrack(videoId, title, outputDir, onProgress, onComplete, onError);
}

// ---------------------------------------------------------
// Endpoints
// ---------------------------------------------------------
router.post('/', (req, res) => {
  const { videoId, title, artist, album, thumbnail, outputDir, downloadLyrics } = req.body;
  if (!videoId || !outputDir) return res.status(400).json({ error: 'Missing videoId or outputDir' });

  // Duplicate Check
  for (const dl of downloadsMap.values()) {
    if (dl.videoId === videoId && (dl.status === 'queued' || dl.status === 'downloading')) {
      return res.json({ downloadId: dl.downloadId, message: 'Already queued or downloading' });
    }
  }

  const downloadId = crypto.randomUUID();
  downloadsMap.set(downloadId, {
    downloadId, videoId, title: title || 'Unknown Title', artist: artist || 'Unknown Artist',
    album: album || null, thumbnail: thumbnail || null, status: 'queued', percent: '0%', speed: '', eta: ''
  });
  
  markDirty(downloadId);
  downloadQueue.push({ downloadId, videoId, title: title || 'Unknown Title', outputDir, downloadLyrics });
  res.json({ downloadId, message: 'Download queued' });
  
  processQueue();
});

router.post('/bulk', (req, res) => {
  const { songs, outputDir, downloadLyrics } = req.body;
  if (!Array.isArray(songs) || !outputDir) return res.status(400).json({ error: 'Missing songs array or outputDir' });

  // Pre-flight check
  if (!fs.existsSync(outputDir)) {
    try { fs.mkdirSync(outputDir, { recursive: true }); }
    catch (err) { return res.status(400).json({ error: `Output directory invalid: ${err.message}` }); }
  }

  const queuedIds = [];
  for (const song of songs) {
    const { videoId, title, artist, album, thumbnail } = song;
    if (!videoId) continue;
    
    // Duplicate Check
    let isDupe = false;
    for (const dl of downloadsMap.values()) {
      if (dl.videoId === videoId && (dl.status === 'queued' || dl.status === 'downloading')) {
        isDupe = true; break;
      }
    }
    if (isDupe) continue;

    const downloadId = crypto.randomUUID();
    downloadsMap.set(downloadId, {
      downloadId, videoId, title: title || 'Unknown Title', artist: artist || 'Unknown Artist',
      album: album || null, thumbnail: thumbnail || null, status: 'queued', percent: '0%', speed: '', eta: ''
    });
    
    markDirty(downloadId);
    downloadQueue.push({ downloadId, videoId, title: title || 'Unknown Title', outputDir, downloadLyrics });
    queuedIds.push(downloadId);
  }

  res.json({ queuedIds, message: `${queuedIds.length} downloads queued` });
  processQueue();
});

router.post('/clear-queue', (req, res) => {
  // Empty pending queue (does not stop actively downloading items)
  downloadQueue = [];
  // Update map state for ones that were purely queued
  for (const dl of downloadsMap.values()) {
    if (dl.status === 'queued') {
      dl.status = 'error';
      dl.error = 'Cancelled by user';
      markDirty(dl.downloadId);
    }
  }
  scheduleSave();
  res.json({ message: 'Pending queue cleared' });
});

router.post('/clear-cache', (req, res) => {
  for (const [id, dl] of downloadsMap.entries()) {
    if (dl.status === 'completed' || dl.status === 'error') {
      downloadsMap.delete(id);
    }
  }
  scheduleSave();

  import('child_process').then(({ exec }) => {
    exec(`"${YTDLP_PATH}" --rm-cache-dir`, (err, stdout, stderr) => {
      if (err) console.error('Failed to clear yt-dlp cache:', err);
      else console.log('yt-dlp cache cleared successfully:', stdout.trim());
    });
  });

  // Force broadcast initial state to sync UI deletion
  const payload = JSON.stringify({ type: 'INITIAL', data: Array.from(downloadsMap.entries()) });
  for (const client of sseClients) {
    client.write(`data: ${payload}\n\n`);
  }
  res.json({ message: 'Cache cleared successfully' });
});

router.get('/progress', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  sseClients.add(res);

  // Send INITIAL payload
  res.write(`data: ${JSON.stringify({ type: 'INITIAL', data: Array.from(downloadsMap.entries()) })}\n\n`);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

// Helper at end
function embedLyricsToM4A(filePath, lyricsText) {
  return new Promise((resolve, reject) => {
    const tempPath = filePath.replace(/\.m4a$/, '.temp.m4a');
    const args = ['-y', '-i', filePath, '-metadata', `lyrics=${lyricsText}`, '-c', 'copy', tempPath];
    const proc = spawn(FFMPEG_PATH, args);
    proc.on('close', (code) => {
      if (code === 0) {
        try {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          fs.renameSync(tempPath, filePath);
          resolve();
        } catch (e) { reject(e); }
      } else {
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
    proc.on('error', (err) => {
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      reject(err);
    });
  });
}

export default router;
