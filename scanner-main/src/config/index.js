/**
 * Configuration module
 * All settings hardcoded for production deployment
 */

module.exports = {
  // Server configuration
  port: 3000,
  nodeEnv: 'production',

  // Request configuration
  concurrencyLimit: 300,
  requestTimeout: 3000,
  retryAttempts: 1,
  retryDelay: 200,

  // API limits
  maxTokensPerRequest: 3000,
  maxRequestBodySize: '50mb',

  // API endpoints
  dexScreenerBaseUrl: 'https://api.dexscreener.com/latest/dex',
  birdeyeBaseUrl: 'https://public-api.birdeye.so/public',

  // CORS configuration
  corsOrigin: '*',

  // API Key authentication
  requireApiKey: true,
  apiKeys: [
    '1f93e75362c62a31f4e0f8df73c5c549c84c00919a2f9327eb57515a55c5b1d9',
    'ed121a1214247a534fc19dbc28e6d713597db4e8d2b05f9ee1934afcb422964c'
  ],
};
