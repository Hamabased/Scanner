/**
 * API Key Authentication Middleware
 * Protects endpoints with API key validation
 */

const config = require('../config');
const logger = require('../utils/logger');

/**
 * Validate API key from request headers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware
 */
function validateApiKey(req, res, next) {
  // Get API key from header
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  // Check if API key is required
  if (!config.requireApiKey) {
    return next();
  }

  // Validate API key
  if (!apiKey) {
    logger.warn('API request rejected: No API key provided', {
      ip: req.ip,
      path: req.path
    });

    return res.status(401).json({
      success: false,
      error: 'API key required. Provide via X-API-Key header or Authorization: Bearer <key>'
    });
  }

  // Check if API key matches
  const validKeys = config.apiKeys;

  if (!validKeys.includes(apiKey)) {
    logger.warn('API request rejected: Invalid API key', {
      ip: req.ip,
      path: req.path,
      providedKey: apiKey.substring(0, 8) + '...' // Log partial key for debugging
    });

    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  // API key is valid
  logger.info('API request authenticated', {
    path: req.path,
    method: req.method
  });

  next();
}

/**
 * Optional auth middleware - allows requests without key but logs them
 */
function optionalApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (apiKey && config.apiKeys.includes(apiKey)) {
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }

  next();
}

module.exports = {
  validateApiKey,
  optionalApiKey
};
