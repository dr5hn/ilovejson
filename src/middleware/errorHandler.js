/**
 * Error Handler Middleware
 *
 * Wraps API route handlers in try-catch for consistent error handling.
 * Integrates with error tracking services (Sentry) in production.
 */

import { ReE } from '@utils/reusables';

/**
 * Wrap an API handler with error handling
 * @param {Function} handler - Async API route handler function
 * @returns {Function} Wrapped handler with error handling
 */
export const errorHandler = (handler) => {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      // Log error to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.error('API Error:', error);
        console.error('Stack trace:', error.stack);
      }

      // Log to error tracking service in production
      if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
        // TODO: Uncomment when Sentry is installed
        // const Sentry = require('@sentry/node');
        // Sentry.captureException(error, {
        //   extra: {
        //     method: req.method,
        //     url: req.url,
        //     headers: req.headers,
        //   }
        // });
      }

      // Determine error type and return appropriate response
      let statusCode = 500;
      let message = 'Internal server error';

      // Handle JSON parsing errors
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        statusCode = 422;
        message = 'I ❤️ JSON. But you have entered invalid JSON.';
      }
      // Handle validation errors
      else if (error.name === 'ValidationError') {
        statusCode = 422;
        message = error.message;
      }
      // Handle file not found errors
      else if (error.code === 'ENOENT') {
        statusCode = 404;
        message = 'I ❤️ JSON. But I couldn\'t find the file.';
      }
      // Handle custom error messages
      else if (error.message) {
        message = error.message;
      }

      return ReE(res, message, statusCode);
    }
  };
};
