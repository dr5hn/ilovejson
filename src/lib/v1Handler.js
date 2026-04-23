import { authenticateApiToken, setCorsHeaders } from '@middleware/apiTokenAuth';
import { rateLimit } from '@middleware/rateLimit';
import { getEntitlements } from '@lib/entitlements';
import prisma from '@lib/prisma';

function runMiddlewareOnce(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function finalizeUsage(reservationId, tokenId, route, status, inputBytes, outputBytes, durationMs) {
  if (reservationId) {
    prisma.apiUsage.update({
      where: { id: reservationId },
      data: { status, inputBytes, outputBytes, durationMs },
    }).catch(() => {});
  } else {
    prisma.apiUsage.create({
      data: { tokenId, route, status, inputBytes, outputBytes, durationMs },
    }).catch(() => {});
  }
}

// Reserve a slot atomically: write the row first, count including it,
// then delete and block if the count exceeds the daily limit.
// This prevents concurrent requests from pushing the total beyond the cap.
async function reserveDailySlot(tokenId, userId, route, perDay) {
  if (!perDay) return { allowed: true, reservationId: null }; // unlimited

  const reservation = await prisma.apiUsage.create({
    data: { tokenId, route, status: 0, inputBytes: 0, outputBytes: 0, durationMs: 0 },
    select: { id: true },
  });

  const since = new Date(Date.now() - 86400000);
  const count = await prisma.apiUsage.count({
    where: { token: { userId }, createdAt: { gte: since } },
  });

  if (count > perDay) {
    await prisma.apiUsage.delete({ where: { id: reservation.id } }).catch(() => {});
    return { allowed: false, reservationId: null };
  }

  return { allowed: true, reservationId: reservation.id };
}

export function createV1Handler(fn, methods = ['POST']) {
  return async (req, res) => {
    setCorsHeaders(res);

    if (req.method === 'OPTIONS') return res.status(204).end();

    if (!methods.includes(req.method)) {
      return res.status(405).json({ error: 'method_not_allowed' });
    }

    const authed = await authenticateApiToken(req, res);
    if (!authed) return;

    const entitlements = await getEntitlements(req.apiToken.userId);

    // Gate: API access enabled for this tier?
    if (!entitlements.apiEnabled) {
      return res.status(403).json({
        error: 'api_not_available',
        message: 'API access requires a Pro or Business subscription.',
        upgrade_url: `${process.env.NEXTAUTH_URL || 'https://www.ilovejson.com'}/pricing`,
      });
    }

    // Per-minute rate limit from entitlements
    const perMinuteLimit = rateLimit({
      maxRequests: entitlements.apiRateLimit.perMinute,
      windowMs: 60000,
      keyFn: req => req.apiToken.id,
      v1: true,
    });
    await runMiddlewareOnce(req, res, perMinuteLimit);
    if (res.headersSent) return;

    // Per-day rate limit — reserve a slot atomically to prevent exceeding the hard cap
    const route = req.url.split('?')[0];
    const { allowed, reservationId } = await reserveDailySlot(
      req.apiToken.id, req.apiToken.userId, route, entitlements.apiRateLimit.perDay,
    );
    if (!allowed) {
      return res.status(429).json({
        error: 'daily_rate_limit_exceeded',
        limit: entitlements.apiRateLimit.perDay,
      });
    }

    const start = Date.now();
    const inputBytes = req.headers['content-length']
      ? parseInt(req.headers['content-length'], 10)
      : Buffer.byteLength(JSON.stringify(req.body || ''));

    let outputBytes = 0;
    const originalJson = res.json.bind(res);
    res.json = data => {
      try { outputBytes = Buffer.byteLength(JSON.stringify(data)); } catch { }
      return originalJson(data);
    };

    res.on('finish', () => {
      finalizeUsage(reservationId, req.apiToken.id, route, res.statusCode, inputBytes, outputBytes, Date.now() - start);
    });

    try {
      await fn(req, res);
    } catch (err) {
      console.error('[v1]', err.message);
      if (!res.headersSent) {
        const status = err.statusCode === 400 ? 400 : 500;
        const error  = status === 400 ? err.message : 'internal_server_error';
        res.status(status).json({ error });
      }
    }
  };
}
