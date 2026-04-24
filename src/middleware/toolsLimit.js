import { resolveToolsTier } from '@lib/resolveToolsTier';
import { ReE } from '@utils/reusables';
import fs from 'fs';
import path from 'path';

const FREE_DAILY_LIMIT = 1;
export const FREE_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// File-based store — survives HMR reloads and server restarts
const STORE_DIR = path.join(process.cwd(), '.data');
const STORE_FILE = path.join(STORE_DIR, 'tool-usage.json');

function todayUTC() {
  return new Date().toISOString().split('T')[0];
}

function loadStore() {
  try {
    const raw = JSON.parse(fs.readFileSync(STORE_FILE, 'utf8'));
    const today = todayUTC();
    const clean = {};
    for (const [k, v] of Object.entries(raw)) {
      if (k.endsWith(today)) clean[k] = v;
    }
    return clean;
  } catch {
    return {};
  }
}

function saveStore(store) {
  try {
    if (!fs.existsSync(STORE_DIR)) fs.mkdirSync(STORE_DIR, { recursive: true });
    fs.writeFileSync(STORE_FILE, JSON.stringify(store));
  } catch { /* ignore */ }
}

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

/**
 * Enforces per-tool daily conversion limit and file size cap based on tier.
 * FREE  → 1 conversion / tool / day, 5 MB max file
 * PRO / BUSINESS → unlimited (Tools Pro is included in any paid plan for now)
 */
export const toolsLimit = () => async (req, res, next) => {
  const tier = await resolveToolsTier(req, res);
  req.userTier = tier;

  if (tier !== 'FREE') {
    req.toolsFileSizeLimit = null; // use tool's configured max
    return next();
  }

  req.toolsFileSizeLimit = FREE_FILE_SIZE;

  const ip = getClientIp(req);
  const toolSlug = (req.url || '').split('?')[0].replace('/api/', '');
  const key = `${ip}:${toolSlug}:${todayUTC()}`;

  const store = loadStore();
  const used = store[key] || 0;

  if (used >= FREE_DAILY_LIMIT) {
    return ReE(
      res,
      'You have reached the free limit of 1 conversion per tool per day. Upgrade to Pro for unlimited access.',
      429,
    );
  }

  store[key] = used + 1;
  saveStore(store);

  next();
};
