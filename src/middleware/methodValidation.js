/**
 * Method Validation Middleware
 *
 * Validates HTTP request methods and returns 405 for invalid methods.
 */

import { ReE } from '@utils/reusables';

/**
 * Create a middleware that validates HTTP method
 * @param {Array<string>} allowedMethods - Array of allowed HTTP methods (e.g., ['POST', 'GET'])
 * @returns {Function} Middleware function
 */
export const validateMethod = (allowedMethods = ['POST']) => {
  return (req, res, next) => {
    if (!allowedMethods.includes(req.method)) {
      return ReE(res, 'I ❤️ JSON. But you shouldn\'t be here.', 405);
    }
    next();
  };
};
