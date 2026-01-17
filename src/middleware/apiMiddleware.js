/**
 * Middleware Composition System
 *
 * Provides a composable middleware runner for API routes.
 * Allows chaining multiple middleware functions in sequence.
 */

/**
 * Run multiple middleware functions in sequence
 * @param {Object} req - Next.js request object
 * @param {Object} res - Next.js response object
 * @param {Array<Function>} middlewares - Array of middleware functions
 * @returns {Promise<void>}
 */
export async function runMiddleware(req, res, middlewares) {
  const responseFinished = () => res.headersSent || res.writableEnded;

  for (const middleware of middlewares) {
    if (responseFinished()) {
      const err = new Error('RESPONSE_SENT');
      err.code = 'RESPONSE_SENT';
      throw err;
    }

    await new Promise((resolve, reject) => {
      let settled = false;
      let nextCalled = false;

      const finish = (err) => {
        if (settled) return;
        settled = true;
        if (err) return reject(err);
        resolve();
      };

      const next = (err) => {
        nextCalled = true;
        finish(err);
      };

      try {
        const result = middleware(req, res, next);
        if (result && typeof result.then === 'function') {
          result.then(() => {
            if (!nextCalled) finish();
          }).catch(finish);
          return;
        }

        if (!nextCalled) {
          finish();
        }
      } catch (error) {
        finish(error);
      }
    });

    if (responseFinished()) {
      const err = new Error('RESPONSE_SENT');
      err.code = 'RESPONSE_SENT';
      throw err;
    }
  }
}
