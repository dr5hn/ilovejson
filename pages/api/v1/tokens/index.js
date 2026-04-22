import crypto from 'crypto';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@lib/auth';
import prisma from '@lib/prisma';
import { setCorsHeaders } from '@middleware/apiTokenAuth';

export const config = { api: { bodyParser: true } };

const EXPIRY_OPTIONS = {
  '30d': 30,
  '90d': 90,
  '365d': 365,
  never: null,
};

export default async function handler(req, res) {
  setCorsHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'unauthenticated' });
  }

  // GET /api/v1/tokens — list tokens
  if (req.method === 'GET') {
    const tokens = await prisma.apiToken.findMany({
      where: { userId: session.user.id, revokedAt: null },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        lastUsedAt: true,
        createdAt: true,
        expiresAt: true,
        _count: { select: { usages: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json({ tokens });
  }

  // POST /api/v1/tokens — create token
  if (req.method === 'POST') {
    const { name, expiresIn = 'never' } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'missing_field', field: 'name' });
    }
    if (!EXPIRY_OPTIONS.hasOwnProperty(expiresIn)) {
      return res.status(400).json({ error: 'invalid_expiry', valid: Object.keys(EXPIRY_OPTIONS) });
    }

    // Count existing tokens
    const count = await prisma.apiToken.count({
      where: { userId: session.user.id, revokedAt: null },
    });
    if (count >= 10) {
      return res.status(400).json({ error: 'token_limit_reached', message: 'Maximum 10 active tokens allowed.' });
    }

    const secret = crypto.randomBytes(32).toString('hex');
    const plaintext = `ilj_${secret}`;
    const tokenHash = crypto.createHash('sha256').update(plaintext).digest('hex');
    const tokenPrefix = plaintext.slice(0, 8);

    const expiresAt = EXPIRY_OPTIONS[expiresIn] !== null
      ? new Date(Date.now() + EXPIRY_OPTIONS[expiresIn] * 86400000)
      : null;

    const token = await prisma.apiToken.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        tokenHash,
        tokenPrefix,
        expiresAt,
      },
      select: { id: true, name: true, tokenPrefix: true, createdAt: true, expiresAt: true },
    });

    return res.status(201).json({ token, plaintext });
  }

  return res.status(405).json({ error: 'method_not_allowed' });
}
