import express from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { downloadTrack } from '../services/downloadService.js';
import { getLyricsText } from '../services/ytmusicService.js';
import { FFMPEG_PATH, YTDLP_PATH } from '../utils/dependencyChecker.js';
import { resolveOutputDir } from '../utils/sanitize.js';
import { getDataDir } from '../utils/paths.js';

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

const QUEUE_FILE = path.join(getDataDir(), 'queue.json');
const QUEUE_FILE_TEMP = path.join(getDataDir(), 'queue.temp.json');

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
  const { downloadId, videoId, title, outputDir, downloadLyrics, audioFormat = 'm4a' } = task;

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
      const finalPath = path.join(outputDir, `${sanitizedTitle}.${audioFormat}`);
      
      if (downloadLyrics) {
        try {
          const lyricsText = await getLyricsText(videoId);
          if (lyricsText) {
            await embedLyrics(finalPath, lyricsText, audioFormat);
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
    processQueue();
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

  downloadTrack(videoId, title, outputDir, audioFormat, onProgress, onComplete, onError);
}

// ---------------------------------------------------------
// Endpoints
// ---------------------------------------------------------
router.post('/', (req, res) => {
  let { videoId, title, artist, album, thumbnail, outputDir, downloadLyrics, audioFormat } = req.body;
  if (!videoId || !outputDir) return res.status(400).json({ error: 'Missing videoId or outputDir' });
  outputDir = resolveOutputDir(outputDir);

  // Duplicate Check & Recycle
  let recycledId = null;
  for (const dl of downloadsMap.values()) {
    if (dl.videoId === videoId) {
      if (dl.status === 'queued' || dl.status === 'downloading') {
        return res.json({ downloadId: dl.downloadId, message: 'Already queued or downloading' });
      } else if (dl.status === 'error') {
        recycledId = dl.downloadId;
      }
    }
  }

  const formatToUse = audioFormat || 'm4a';
  const safeTitle = (title || 'Unknown Title').replace(/[\\/:*?"<>|]/g, '_');
  const expectedPath = path.join(outputDir, `${safeTitle}.${formatToUse}`);
  
  const downloadId = recycledId || crypto.randomUUID();

  if (recycledId) {
    downloadsMap.delete(recycledId);
  }

  if (fs.existsSync(expectedPath)) {
    downloadsMap.set(downloadId, {
      downloadId, videoId, title: title || 'Unknown Title', artist: artist || 'Unknown Artist',
      album: album || null, thumbnail: thumbnail || null, status: 'completed', percent: '100%', speed: '', eta: '', filePath: expectedPath, error: null
    });
    markDirty(downloadId);
    return res.json({ downloadId, message: 'Already downloaded' });
  }

  downloadsMap.set(downloadId, {
    downloadId, videoId, title: title || 'Unknown Title', artist: artist || 'Unknown Artist',
    album: album || null, thumbnail: thumbnail || null, status: 'queued', percent: '0%', speed: '', eta: '', error: null
  });
  
  markDirty(downloadId);
  downloadQueue.push({ downloadId, videoId, title: title || 'Unknown Title', outputDir, downloadLyrics, audioFormat: formatToUse });
  res.json({ downloadId, message: 'Download queued' });
  
  processQueue();
});

router.post('/bulk', (req, res) => {
  let { songs, outputDir, downloadLyrics, audioFormat } = req.body;
  if (!Array.isArray(songs) || !outputDir) return res.status(400).json({ error: 'Missing songs array or outputDir' });
  outputDir = resolveOutputDir(outputDir);

  // Pre-flight check
  if (!fs.existsSync(outputDir)) {
    try { fs.mkdirSync(outputDir, { recursive: true }); }
    catch (err) { return res.status(400).json({ error: `Output directory invalid: ${err.message}` }); }
  }

  const queuedIds = [];
  const formatToUse = audioFormat || 'm4a';

  for (const song of songs) {
    const { videoId, title, artist, album, thumbnail } = song;
    if (!videoId) continue;
    
    // Duplicate Check
    let isDupe = false;
    let recycledId = null;
    for (const dl of downloadsMap.values()) {
      if (dl.videoId === videoId) {
        if (dl.status === 'queued' || dl.status === 'downloading') {
          isDupe = true; break;
        } else if (dl.status === 'error') {
          recycledId = dl.downloadId;
        }
      }
    }
    if (isDupe) continue;

    const safeTitle = (title || 'Unknown Title').replace(/[\\/:*?"<>|]/g, '_');
    const expectedPath = path.join(outputDir, `${safeTitle}.${formatToUse}`);
    const downloadId = recycledId || crypto.randomUUID();

    if (recycledId) {
      downloadsMap.delete(recycledId);
    }

    if (fs.existsSync(expectedPath)) {
      downloadsMap.set(downloadId, {
        downloadId, videoId, title: title || 'Unknown Title', artist: artist || 'Unknown Artist',
        album: album || null, thumbnail: thumbnail || null, status: 'completed', percent: '100%', speed: '', eta: '', filePath: expectedPath, error: null
      });
      markDirty(downloadId);
      queuedIds.push(downloadId);
      continue;
    }

    downloadsMap.set(downloadId, {
      downloadId, videoId, title: title || 'Unknown Title', artist: artist || 'Unknown Artist',
      album: album || null, thumbnail: thumbnail || null, status: 'queued', percent: '0%', speed: '', eta: '', error: null
    });
    
    markDirty(downloadId);
    downloadQueue.push({ downloadId, videoId, title: title || 'Unknown Title', outputDir, downloadLyrics, audioFormat: formatToUse });
    queuedIds.push(downloadId);
  }

  res.json({ queuedIds, message: `${queuedIds.length} downloads queued` });
  processQueue();
});

export function syncDownloadDirectory(outputDir) {
  if (!outputDir || !fs.existsSync(outputDir)) {
    return;
  }

  const files = fs.readdirSync(outputDir);
  const audioExtensions = ['.mp3', '.m4a'];
  const filesOnDisk = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    if (audioExtensions.includes(ext)) {
      const baseName = path.basename(file, ext);
      filesOnDisk.push({
        fileName: file,
        baseName,
        ext,
        filePath: path.join(outputDir, file)
      });
    }
  }

  const diskMap = new Map();
  for (const f of filesOnDisk) {
    diskMap.set(f.baseName.toLowerCase(), f);
  }

  let mapChanged = false;
  for (const [id, dl] of downloadsMap.entries()) {
    const sanitizedTitle = (dl.title || '').replace(/[\\/:*?"<>|]/g, '_');
    const key = sanitizedTitle.toLowerCase();
    const diskFile = diskMap.get(key);

    if (diskFile) {
      if (dl.status !== 'completed' || dl.filePath !== diskFile.filePath) {
        dl.status = 'completed';
        dl.percent = '100%';
        dl.filePath = diskFile.filePath;
        dl.error = null;
        markDirty(id);
        mapChanged = true;
      }
      diskMap.delete(key);
    } else {
      if (dl.status === 'completed') {
        if (!dl.filePath || !fs.existsSync(dl.filePath)) {
          dl.status = 'error';
          dl.error = 'File not found on disk';
          markDirty(id);
          mapChanged = true;
        }
      } else if (dl.status === 'error' && dl.error === 'File not found on disk') {
        if (dl.filePath && fs.existsSync(dl.filePath)) {
          dl.status = 'completed';
          dl.percent = '100%';
          dl.error = null;
          markDirty(id);
          mapChanged = true;
        }
      }
    }
  }

  for (const [key, diskFile] of diskMap.entries()) {
    const downloadId = crypto.randomUUID();
    const videoId = `local-${crypto.createHash('md5').update(diskFile.baseName).digest('hex')}`;
    
    downloadsMap.set(downloadId, {
      downloadId,
      videoId,
      title: diskFile.baseName,
      artist: 'Local File',
      album: null,
      thumbnail: null,
      status: 'completed',
      percent: '100%',
      speed: '',
      eta: '',
      filePath: diskFile.filePath,
      error: null
    });
    markDirty(downloadId);
    mapChanged = true;
  }

  if (mapChanged) {
    scheduleSave();
    
    const payload = JSON.stringify({ type: 'INITIAL', data: Array.from(downloadsMap.entries()) });
    for (const client of sseClients) {
      client.write(`data: ${payload}\n\n`);
    }
  }
}

router.post('/sync', (req, res) => {
  const { outputDir } = req.body;
  if (!outputDir) {
    return res.status(400).json({ error: 'Missing outputDir' });
  }

  try {
    syncDownloadDirectory(outputDir);
    res.json({ message: 'Sync complete' });
  } catch (err) {
    console.error('[Sync] Sync failed:', err);
    res.status(500).json({ error: 'Sync failed', details: err.message });
  }
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
  downloadsMap.clear();
  downloadQueue.length = 0;
  activeDownloads = 0;
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
function embedLyrics(filePath, lyricsText, format = 'm4a') {
  return new Promise((resolve, reject) => {
    const extRegex = new RegExp(`\\.${format}$`);
    const tempPath = filePath.replace(extRegex, `.temp.${format}`);
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
