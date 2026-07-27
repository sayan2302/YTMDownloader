import os from 'os';
import path from 'path';
import fs from 'fs';

export function getDataDir() {
  const dir = path.join(os.homedir(), '.ytm');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
