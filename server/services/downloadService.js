import { spawn } from 'child_process';
import { sanitizeFilename, resolveOutputDir } from '../utils/sanitize.js';
import fs from 'fs';
import path from 'path';
import { YTDLP_PATH, FFMPEG_PATH } from '../utils/dependencyChecker.js';

const activeProcesses = new Set();

const killActiveProcesses = () => {
  for (const proc of activeProcesses) {
    if (!proc.killed) {
      console.log(`[Shutdown] Killing orphaned yt-dlp process PID: ${proc.pid}`);
      try { proc.kill('SIGKILL'); } catch (e) {}
    }
  }
};

process.on('exit', killActiveProcesses);
process.on('SIGINT', () => {
  killActiveProcesses();
  process.exit(0);
});
process.on('SIGTERM', () => {
  killActiveProcesses();
  process.exit(0);
});

function cleanupTempFiles(outputDir, title) {
  try {
    if (!fs.existsSync(outputDir) || !title) return;

    // Sanitize title matching yt-dlp filename cleaning rules
    const sanitizedTitle = title.replace(/[\\/:*?"<>|]/g, '_');

    const files = fs.readdirSync(outputDir);
    // Temporary formats generated during downloading and post-processing
    const tempExtensions = ['.webp', '.jpg', '.jpeg', '.png', '.part', '.ytdl', '.temp'];

    files.forEach(file => {
      // Check if file prefix matches the sanitized title
      if (file.startsWith(sanitizedTitle)) {
        const ext = path.extname(file).toLowerCase();
        if (tempExtensions.includes(ext) || file.endsWith('.temp.webp') || file.endsWith('.m4a.part') || file.endsWith('.mp3.part')) {
          const fullPath = path.join(outputDir, file);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`[Clean-up] Cleaned stray failure file: ${file}`);
          }
        }
      }
    });
  } catch (err) {
    console.error('[Clean-up] Failed to delete temp files:', err);
  }
}

export function downloadTrack(videoId, title, rawOutputDir, audioFormat = 'm4a', onProgress, onComplete, onError) {
  if (typeof audioFormat === 'function') {
    onError = onComplete;
    onComplete = onProgress;
    onProgress = audioFormat;
    audioFormat = 'm4a';
  }
  const outputDir = resolveOutputDir(rawOutputDir);
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    try {
      fs.mkdirSync(outputDir, { recursive: true });
    } catch (err) {
      onError(new Error(`Failed to create output directory: ${err.message}`));
      return null;
    }
  }

  const sanitizedTitle = (title || 'Unknown Title').replace(/[\\/:*?"<>|]/g, '_');

  const args = [
    '--no-cache-dir',
    '--no-check-certificates',
    ...(path.isAbsolute(FFMPEG_PATH) ? ['--ffmpeg-location', FFMPEG_PATH] : []),
    '--extractor-args', 'youtube:player_client=android,web,tv',
    '-f', 'ba/b/best',
    '-x',
    '--audio-format', audioFormat,
    '--embed-metadata',
    '--embed-thumbnail',
    '--progress-template', '%(progress)j',
    '-o', path.join(outputDir, `${sanitizedTitle}.%(ext)s`),
    '--no-playlist',
    `https://music.youtube.com/watch?v=${videoId}`
  ];

  const proc = spawn(YTDLP_PATH, args, { timeout: 300000 }); // 5 minutes hard timeout
  activeProcesses.add(proc);
  
  let stderrData = '';

  proc.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed && trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const progressInfo = JSON.parse(trimmed);
          onProgress({
            percent: progressInfo._percent_str || '0%',
            speed: progressInfo._speed_str || 'Unknown',
            eta: progressInfo._eta_str || 'Unknown'
          });
        } catch (e) {
          // Ignore non-JSON stdout
        }
      }
    });
  });

  proc.stderr.on('data', (data) => {
    const msg = data.toString();
    stderrData += msg;
    console.error(`[yt-dlp stderr] ${msg}`);
    if (msg.toLowerCase().includes('ffmpeg is not installed') || msg.toLowerCase().includes('ffprobe is not installed')) {
      onError(new Error('FFmpeg is not installed'));
    }
  });

  proc.on('close', (code, signal) => {
    activeProcesses.delete(proc);
    if (signal === 'SIGTERM') {
      onError(new Error('Process timeout (5 minutes exceeded)'));
      return;
    }
    if (code === 0) {
      onComplete();
    } else {
      cleanupTempFiles(outputDir, title);
      const lines = stderrData.split('\n');
      const errorLine = lines.find(l => l.trim().startsWith('ERROR:')) || '';
      const cleanError = errorLine ? errorLine.replace(/ERROR:\s*/i, '').trim() : `yt-dlp exited with code ${code}`;
      onError(new Error(cleanError));
    }
  });

  proc.on('error', (err) => {
    activeProcesses.delete(proc);
    cleanupTempFiles(outputDir, title);
    if (err.code === 'ENOENT') {
      onError(new Error('yt-dlp is not installed.'));
    } else {
      onError(err);
    }
  });

  return proc;
}
