import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import ffmpeg from 'ffmpeg-static';
import { getDataDir } from './paths.js';

const BIN_DIR = path.join(getDataDir(), 'bin');
let YTDLP_PATH = 'yt-dlp';
let FFMPEG_PATH = ffmpeg || 'ffmpeg';

const status = {
  status: 'idle', // 'idle' | 'checking' | 'downloading' | 'ready' | 'failed'
  ytDlp: 'idle', // 'idle' | 'checking' | 'downloading' | 'ready' | 'failed'
  ffmpeg: 'idle', // 'idle' | 'checking' | 'ready' | 'failed'
  error: null
};

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    function get(reqUrl) {
      https.get(reqUrl, (response) => {
        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          get(response.headers.location);
          return;
        }
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download from ${reqUrl}: Status Code ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }).on('error', (err) => {
        fs.unlink(destPath, () => reject(err));
      });
    }
    get(url);
  });
}

export async function checkAndSetupDependencies() {
  status.status = 'checking';
  status.ytDlp = 'checking';
  status.ffmpeg = 'checking';
  console.log('[System Check] Commencing system dependency check...');

  // 1. FFmpeg Verification
  try {
    if (ffmpeg && fs.existsSync(ffmpeg)) {
      console.log(`[System Check] FFmpeg resolved via ffmpeg-static at: ${ffmpeg}`);
      if (process.platform !== 'win32') {
        try { fs.chmodSync(ffmpeg, '755'); } catch (e) {}
      }
      FFMPEG_PATH = ffmpeg;
      status.ffmpeg = 'ready';
    } else {
      execSync('ffmpeg -version', { stdio: 'ignore' });
      console.log('[System Check] FFmpeg resolved via global installation.');
      FFMPEG_PATH = 'ffmpeg';
      status.ffmpeg = 'ready';
    }
  } catch (err) {
    console.error('[System Check] FFmpeg check failed globally.', err);
    status.ffmpeg = 'failed';
    status.error = 'FFmpeg is not installed on this system.';
  }

  // 2. yt-dlp Verification
  try {
    let resolvedGlobal = false;
    if (process.platform === 'darwin') {
      const commonPaths = ['/opt/homebrew/bin/yt-dlp', '/usr/local/bin/yt-dlp', '/usr/bin/yt-dlp'];
      for (const p of commonPaths) {
        if (fs.existsSync(p)) {
          try {
            execSync(`"${p}" --version`, { stdio: 'ignore' });
            console.log(`[System Check] yt-dlp resolved at common macOS path: ${p}`);
            YTDLP_PATH = p;
            status.ytDlp = 'ready';
            resolvedGlobal = true;
            break;
          } catch (e) {}
        }
      }
    }

    if (!resolvedGlobal) {
      execSync('yt-dlp --version', { stdio: 'ignore' });
      console.log('[System Check] yt-dlp resolved via global installation.');
      YTDLP_PATH = 'yt-dlp';
      status.ytDlp = 'ready';
    }
  } catch (err) {
    console.log('[System Check] yt-dlp not found globally. Checking local bin/ folder...');
    
    // Ensure bin folder exists
    if (!fs.existsSync(BIN_DIR)) {
      fs.mkdirSync(BIN_DIR, { recursive: true });
    }

    const binaryName = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    const localPath = path.join(BIN_DIR, binaryName);

    if (fs.existsSync(localPath)) {
      try {
        if (process.platform !== 'win32') {
          fs.chmodSync(localPath, '755');
          if (process.platform === 'darwin') {
            try { execSync(`xattr -d com.apple.quarantine "${localPath}"`, { stdio: 'ignore' }); } catch (e) {}
          }
        }
        execSync(`"${localPath}" --version`, { stdio: 'ignore' });
        console.log(`[System Check] Local yt-dlp found at: ${localPath}`);
        YTDLP_PATH = localPath;
        status.ytDlp = 'ready';
      } catch (binErr) {
        console.warn('[System Check] Local yt-dlp check failed, starting re-download.', binErr);
        try { fs.unlinkSync(localPath); } catch (e) {}
      }
    }

    // Download if not resolved
    if (status.ytDlp !== 'ready') {
      try {
        status.status = 'downloading';
        status.ytDlp = 'downloading';
        console.log('[System Check] Downloading yt-dlp from GitHub...');

        let downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux';
        if (process.platform === 'win32') {
          downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
        } else if (process.platform === 'darwin') {
          // Use the shebang-based Python script instead of yt-dlp_macos to avoid PyInstaller 30s decompression delay on macOS
          downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
        }

        await downloadFile(downloadUrl, localPath);
        
        if (process.platform !== 'win32') {
          fs.chmodSync(localPath, '755');
          if (process.platform === 'darwin') {
            try { execSync(`xattr -d com.apple.quarantine "${localPath}"`, { stdio: 'ignore' }); } catch (e) {}
          }
        }

        // Final verification of downloaded binary
        execSync(`"${localPath}" --version`, { stdio: 'ignore' });
        console.log(`[System Check] yt-dlp successfully downloaded and verified at: ${localPath}`);
        YTDLP_PATH = localPath;
        status.ytDlp = 'ready';
      } catch (dlErr) {
        console.error('[System Check] Failed to download or verify local yt-dlp:', dlErr);
        status.ytDlp = 'failed';
        status.error = `yt-dlp is missing and auto-download failed: ${dlErr.message}`;
      }
    }
  }

  // Final Overall Status
  if (status.ffmpeg === 'ready' && status.ytDlp === 'ready') {
    status.status = 'ready';
    status.error = null;
    console.log('[System Check] Setup successful! All dependencies resolved.');
  } else {
    status.status = 'failed';
    console.error('[System Check] Setup failed. Dependencies are incomplete.');
  }
}

export function getDependencyStatus() {
  return status;
}

export { YTDLP_PATH, FFMPEG_PATH };
