import fs from 'fs';
import path from 'path';
import { globals } from '@constants/globals';

const FILE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const CLEANUP_INTERVAL_MS = 2 * 60 * 1000; // Run at most every 2 minutes

let lastCleanupTime = 0;

/**
 * Remove files older than FILE_TTL_MS from a directory.
 * @param {string} dirPath - Absolute or relative path to scan
 */
function cleanDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const now = Date.now();

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        cleanDirectory(fullPath);
        continue;
      }

      // Skip .gitkeep files
      if (entry.name === '.gitkeep') continue;

      try {
        const stat = fs.statSync(fullPath);
        const ageMs = now - stat.mtimeMs;
        if (ageMs > FILE_TTL_MS) {
          fs.unlinkSync(fullPath);
        }
      } catch {
        // File may have been deleted by another request — ignore
      }
    }
  } catch {
    // Directory read failed — ignore silently
  }
}

/**
 * Run cleanup if enough time has passed since the last run.
 * Designed to be called from API handlers — it's a no-op
 * if called more frequently than CLEANUP_INTERVAL_MS.
 */
export function runCleanupIfNeeded() {
  const now = Date.now();
  if (now - lastCleanupTime < CLEANUP_INTERVAL_MS) return;
  lastCleanupTime = now;

  // Run async so it doesn't block the request
  setImmediate(() => {
    cleanDirectory(path.resolve(globals.uploadDir));
    cleanDirectory(path.resolve(globals.downloadDir));
  });
}
