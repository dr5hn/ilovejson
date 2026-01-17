/**
 * Rate Limiting Middleware
 *
 * Implements per-IP rate limiting using in-memory Map.
 * For production with multiple server instances, migrate to Redis.
 */

import { ReE } from '@utils/reusables';

// In-memory rate limit store (will need Redis for multi-instance deployment)
const rateLimitStore = new Map();

/**
 * Create a rate limiting middleware
 * @param {Object} options - Configuration options
 * @param {number} options.maxRequests - Maximum requests allowed (default: 20 for free tier)
 * @param {number} options.windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns {Function} Middleware function
 */
export const rateLimit = (options = {}) => {
  const maxRequests = options.maxRequests || 20; // Free tier limit
  const windowMs = options.windowMs || 60000; // 1 minute

  return (req, res, next) => {
    // Get client IP address
    const forwarded = req.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const rawIp = forwardedIp ||
      req.headers['x-real-ip'] ||
      req.socket?.remoteAddress ||
      req.connection?.remoteAddress ||
      'unknown';

    const ip = rawIp.includes(',')
      ? rawIp.split(',')[0].trim()
      : rawIp.trim();

    const key = `ratelimit:${ip}`;

    const now = Date.now();
    const record = rateLimitStore.get(key) || {
      count: 0,
      resetTime: now + windowMs
    };

    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    // Check if limit exceeded
    if (record.count >= maxRequests) {
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

      return ReE(res, 'Rate limit exceeded. Please try again later.', 429);
    }

    // Increment counter
    record.count++;
    rateLimitStore.set(key, record);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - record.count);
    res.setHeader('X-RateLimit-Reset', new Date(record.resetTime).toISOString());

    next();
  };
};

/**
 * Cleanup old entries every 5 minutes to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    // Remove entries that are 1 minute past their reset time
    if (now > value.resetTime + 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 300000); // Run every 5 minutes

/**
 * Get current rate limit stats (for debugging/monitoring)
 * @param {string} ip - IP address to check
 * @returns {Object|null} Rate limit record or null
 */
export const getRateLimitStats = (ip) => {
  return rateLimitStore.get(`ratelimit:${ip}`) || null;
};

/**
 * Clear rate limit for specific IP (admin/testing purposes)
 * @param {string} ip - IP address to clear
 */
export const clearRateLimit = (ip) => {
  rateLimitStore.delete(`ratelimit:${ip}`);
};
