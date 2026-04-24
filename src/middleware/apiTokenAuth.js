import crypto from 'crypto';
import prisma from '@lib/prisma';

export async function authenticateApiToken(req, res) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    res.status(401).json({ error: 'missing_token' });
    return false;
  }

  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'invalid_token' });
    return false;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    res.status(401).json({ error: 'invalid_token' });
    return false;
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  let apiToken;
  try {
    apiToken = await prisma.apiToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, revokedAt: true, expiresAt: true },
    });
  } catch {
    res.status(500).json({ error: 'internal_server_error' });
    return false;
  }

  if (!apiToken) {
    res.status(401).json({ error: 'invalid_token' });
    return false;
  }

  if (apiToken.revokedAt) {
    res.status(401).json({ error: 'invalid_token' });
    return false;
  }

  if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
    res.status(401).json({ error: 'invalid_token' });
    return false;
  }

  req.apiToken = apiToken;

  // Fire-and-forget lastUsedAt update
  prisma.apiToken.update({
    where: { id: apiToken.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return true;
}

export function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}
