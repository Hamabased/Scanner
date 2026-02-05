/**
 * API Routes
 * Defines all API endpoints
 */

const express = require('express');
const scanController = require('../controllers/scan.controller');
const { validateApiKey } = require('../middleware/auth');

const router = express.Router();

// Health check endpoint (public - no auth required)
router.get('/health', scanController.healthCheck.bind(scanController));

// Rate limiter status endpoint (public - no auth required)
router.get('/rate-limit', scanController.getRateLimitStatus.bind(scanController));

// Main scan endpoint (protected with API key)
router.post('/scan', validateApiKey, scanController.scanTokens.bind(scanController));

module.exports = router;
