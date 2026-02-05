/**
 * Token Market Data Scanner API
 * Main entry point
 */

require('dotenv').config();
const app = require('./src/app');
const config = require('./src/config');

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║   Token Market Data Scanner API            ║
║   Server running on port ${PORT}            ║
║                                            ║
║   Configuration:                           ║
║   - Concurrency: ${config.concurrencyLimit} requests           ║
║   - Timeout: ${config.requestTimeout}ms                    ║
║   - Retries: ${config.retryAttempts}                        ║
║                                            ║
║   Endpoints:                               ║
║   POST /scan    - Scan token addresses     ║
║   GET  /health  - Health check             ║
╚════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
