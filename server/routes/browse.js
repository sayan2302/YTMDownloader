import express from 'express';
import { exec } from 'child_process';

const router = express.Router();

router.get('/', (req, res) => {
  // Use macOS native AppleScript to open a folder picker
  const script = `osascript -e 'POSIX path of (choose folder with prompt "Select Download Directory")'`;
  
  exec(script, (error, stdout, stderr) => {
    if (error) {
      console.error('Browse folder error:', error);
      // User probably clicked 'Cancel' in the dialog
      return res.status(400).json({ error: 'Folder selection cancelled or failed' });
    }
    
    // Clean up the trailing newline
    const selectedPath = stdout.trim();
    res.json({ path: selectedPath });
  });
});

export default router;
