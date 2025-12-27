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
export function runMiddleware(req, res, middlewares) {
  return new Promise((resolve, reject) => {
    let index = 0;

    const next = (err) => {
      if (err) return reject(err);

      if (index >= middlewares.length) return resolve();

      const middleware = middlewares[index++];
      try {
        middleware(req, res, next);
      } catch (error) {
        reject(error);
      }
    };

    next();
  });
}
