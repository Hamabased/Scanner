/**
 * 404 Not Found Middleware
 * Handles requests to non-existent endpoints
 */

/**
 * 404 handler middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
}

module.exports = notFound;
