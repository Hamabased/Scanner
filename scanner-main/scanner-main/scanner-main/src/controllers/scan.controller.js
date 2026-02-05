/**
 * Scan Controller
 * Handles HTTP requests for the /scan endpoint
 */

const tokenService = require('../services/token.service');

class ScanController {
  /**
   * POST /scan - Scan multiple token addresses
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware
   */
  async scanTokens(req, res, next) {
    try {
      const { tokens } = req.body;

      // Validate input
      const validation = tokenService.validateTokens(tokens);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error
        });
      }

      // Perform scan
      const result = await tokenService.scanTokens(tokens);

      // Return results
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /health - Health check endpoint
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async healthCheck(req, res) {
    const config = require('../config');
    const rateLimiter = require('../utils/rateLimiter');

    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      config: {
        concurrencyLimit: config.concurrencyLimit,
        requestTimeout: config.requestTimeout,
        retryAttempts: config.retryAttempts,
        maxTokensPerRequest: config.maxTokensPerRequest
      },
      rateLimits: rateLimiter.getStatus()
    });
  }

  /**
   * GET /rate-limit - Get rate limiter status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRateLimitStatus(req, res) {
    const rateLimiter = require('../utils/rateLimiter');

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      rateLimits: rateLimiter.getStatus()
    });
  }
}

module.exports = new ScanController();
