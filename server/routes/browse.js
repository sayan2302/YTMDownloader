import express from 'express';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { resolveOutputDir } from '../utils/sanitize.js';

const router = express.Router();

// Cross-Platform OS Directory Picker Dialog (Windows / macOS / Linux)
router.get('/', (req, res) => {
  let command;
  if (process.platform === 'win32') {
    const psScript = `
      Add-Type -AssemblyName System.Windows.Forms
      $f = New-Object System.Windows.Forms.FolderBrowserDialog
      $f.Description = 'Select Download Directory'
      if ($f.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        Write-Output $f.SelectedPath
      }
    `;
    const base64Script = Buffer.from(psScript, 'utf16le').toString('base64');
    command = `powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${base64Script}`;
  } else if (process.platform === 'darwin') {
    command = `osascript -e 'POSIX path of (choose folder with prompt "Select Download Directory")'`;
  } else {
    command = `zenity --file-selection --directory --title="Select Download Directory" || kdialog --getexistingdirectory`;
  }

  // 30-second execution timeout prevents locking server if modal dialog is closed or ignored
  exec(command, { timeout: 30000 }, (error, stdout) => {
    if (error || !stdout || !stdout.trim()) {
      console.warn('[Browse] Folder picker cancelled, timed out, or failed:', error?.message);
      return res.status(400).json({ error: 'Folder selection cancelled or timed out' });
    }
    const selectedPath = stdout.trim();
    res.json({ path: selectedPath });
  });
});

// Open Folder in OS-native File Manager (Finder / Windows Explorer / Linux File Manager)
router.post('/open', (req, res) => {
  let { folderPath } = req.body;
  if (!folderPath || !folderPath.trim()) {
    folderPath = path.join(os.homedir(), 'Downloads');
  }

  const targetDir = resolveOutputDir(folderPath);

  // Ensure directory exists before launching file manager
  if (!fs.existsSync(targetDir)) {
    try {
      fs.mkdirSync(targetDir, { recursive: true });
    } catch (err) {
      return res.status(500).json({ error: `Failed to create folder: ${err.message}` });
    }
  }

  try {
    let proc;
    if (process.platform === 'win32') {
      proc = spawn('explorer.exe', [targetDir], { detached: true, stdio: 'ignore' });
    } else if (process.platform === 'darwin') {
      proc = spawn('open', [targetDir], { detached: true, stdio: 'ignore' });
    } else {
      proc = spawn('xdg-open', [targetDir], { detached: true, stdio: 'ignore' });
    }
    proc.unref();

    res.json({ message: 'Folder opened successfully', path: targetDir });
  } catch (err) {
    console.error(`[Open Folder] Error opening directory (${process.platform}):`, err);
    res.status(500).json({ error: `Could not open folder: ${err.message}` });
  }
});

export default router;
