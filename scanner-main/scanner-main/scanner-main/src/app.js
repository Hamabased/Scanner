/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */

const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  credentials: true
}));

// Body parser middleware
app.use(express.json({ limit: config.maxRequestBodySize }));
app.use(express.urlencoded({ extended: true, limit: config.maxRequestBodySize }));

// API routes
app.use('/', routes);

// 404 handler (must be after all routes)
app.use(notFound);

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
