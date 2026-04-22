import * as Sentry from '@sentry/nextjs';

/**
 * Wraps a Next.js API route handler with Sentry error capture.
 * Tags each event with route, method, and conversion tool.
 * Never forwards request bodies or file contents.
 *
 * Usage:
 *   const handler = async (req, res) => { ... };
 *   export default withErrorTracking(handler, { tool: 'json-to-csv' });
 */
export function withErrorTracking(handler, { tool } = {}) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
        Sentry.withScope((scope) => {
          scope.setTag('route', req.url?.split('?')[0]);
          scope.setTag('method', req.method);
          if (tool) scope.setTag('tool', tool);
          // Deliberately exclude req.body and file contents
          Sentry.captureException(err);
        });
      }
      console.error(`[${tool ?? req.url}] Unhandled error:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: 'Internal server error' });
      }
    }
  };
}
