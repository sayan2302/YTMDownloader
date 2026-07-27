import os from 'os';
import path from 'path';

export function sanitizeFilename(name) {
  if (!name) return 'Unknown';
  // Replace illegal filename characters with underscores
  const sanitized = name.replace(/[\\/:*?"<>|]/g, '_');
  // Trim whitespace
  const trimmed = sanitized.trim();
  // Limit to 200 chars
  return trimmed.substring(0, 200);
}

export function resolveOutputDir(dirPath) {
  if (!dirPath) return dirPath;
  if (dirPath.startsWith('~')) {
    return path.resolve(dirPath.replace(/^~(?=$|\/|\\)/, os.homedir()));
  }
  return path.resolve(dirPath);
}
