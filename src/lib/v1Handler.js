import { authenticateApiToken, setCorsHeaders } from '@middleware/apiTokenAuth';
import { rateLimit } from '@middleware/rateLimit';
import prisma from '@lib/prisma';

const tokenRateLimit = rateLimit({
  maxRequests: 60,
  windowMs: 60000,
  keyFn: req => req.apiToken.id,
  v1: true,
});

function runMiddlewareOnce(req, res, middleware) {
  return new Promise((resolve, reject) => {
    middleware(req, res, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function trackUsage(tokenId, route, status, inputBytes, outputBytes, durationMs) {
  prisma.apiUsage.create({
    data: { tokenId, route, status, inputBytes, outputBytes, durationMs },
  }).catch(() => {});
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

    await runMiddlewareOnce(req, res, tokenRateLimit);
    if (res.headersSent) return;

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
      trackUsage(req.apiToken.id, req.url.split('?')[0], res.statusCode, inputBytes, outputBytes, Date.now() - start);
    });

    try {
      await fn(req, res);
    } catch (err) {
      console.error('[v1]', err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'internal_server_error' });
      }
    }
  };
}
