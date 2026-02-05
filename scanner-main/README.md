# Token Market Data Scanner API

A production-grade, high-performance Express.js API for fetching real-time token market data across multiple blockchains. Engineered to handle massive token batches with sub-second per-token response times.

## Why This API?

Built to solve the problem of scanning thousands of tokens quickly and reliably:

- **Scan 2,000+ tokens in under 30 seconds** (real benchmark: 2,000 Solana tokens in 22s)
- **Handle 3,000 tokens per request** without breaking a sweat
- **Scale to 15,000+ requests per minute** with multi-deployment strategy
- **Bypass rate limits** with intelligent request spoofing
- **Never miss data** with smart fallback between APIs
- **Deploy in seconds** with zero configuration needed

Perfect for token portfolio trackers, DeFi dashboards, trading bots, and analytics platforms.

## Features

- ✅ **Blazing fast**: 300 concurrent requests, 3s timeout per request
- ✅ **Multi-chain support**: Ethereum, BSC, Base, Polygon, Arbitrum, Optimism, Solana
- ✅ **Request spoofing**: 10 rotating user agents bypass DexScreener's 300/min rate limit
- ✅ **Massively scalable**: Deploy 50+ instances = 15,000 req/min total capacity
- ✅ **API key authentication**: Secure access control built-in
- ✅ **Complete data**: Returns contract address, symbol, marketCap, and liquidity
- ✅ **Smart fallback**: DexScreener → Jupiter for Solana tokens
- ✅ **Battle-tested**: Handles 3,000 tokens per request reliably
- ✅ **Zero-config deployment**: Hardcoded settings for instant Vercel deploy

## Quick Start

### Installation

```bash
git clone https://github.com/kidxbt/scanner.git
cd scanner
npm install
```

### Running Locally

```bash
node server.js
```

The API will start on `http://localhost:3000` with all settings pre-configured.

### Deploy to Vercel

**Single deployment:**
```bash
vercel --prod
```

**Mass deployment (35+ instances):**
```bash
node mass-deploy.js
```

This creates 35 separate Vercel deployments for 10,500 req/min total capacity.

## API Endpoints

### POST /scan

Scan multiple token addresses and fetch their market data.

**Request:**

```bash
curl -X POST https://your-deployment.vercel.app/scan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "tokens": [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "So11111111111111111111111111111111111111112",
      "0xdAC17F958D2ee523a2206206994597C13D831ec7"
    ]
  }'
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "address": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "symbol": "WETH",
      "marketCapUSD": 8983170485,
      "liquidityUSD": 147871734
    },
    {
      "address": "So11111111111111111111111111111111111111112",
      "symbol": "SOL",
      "marketCapUSD": 100105785469.70412,
      "liquidityUSD": 112039894881.49695
    },
    {
      "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      "symbol": "USDT",
      "marketCapUSD": 57091841,
      "liquidityUSD": 696532.46
    }
  ]
}
```

**Authentication:**

API keys are required for all requests. Include via `X-API-Key` header or `Authorization: Bearer` header.

**Error Response:**

```json
{
  "success": false,
  "error": "API key required. Provide via X-API-Key header or Authorization: Bearer <key>"
}
```

### GET /health

Health check endpoint to verify API status.

**Response:**

```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-10-13T12:00:00.000Z",
  "config": {
    "concurrencyLimit": 300,
    "requestTimeout": 3000,
    "retryAttempts": 1,
    "maxTokensPerRequest": 3000
  },
  "rateLimits": {
    "dexscreener": {
      "limit": 300,
      "remaining": 287,
      "resetAt": "2025-10-13T12:01:00.000Z"
    }
  }
}
```

## Performance Benchmarks

Real-world performance with 50 deployed endpoints:

- **1,818 EVM tokens**: 11 seconds (~165 tokens/second)
- **2,000 Solana tokens**: 22 seconds (~91 tokens/second)
- **Total capacity**: 15,000 requests/minute (50 endpoints × 300 req/min)
- **Concurrency**: 300 parallel requests per instance
- **Timeout**: 3 seconds per request

## Configuration

All settings are **hardcoded** in [src/config/index.js](src/config/index.js):

```javascript
module.exports = {
  port: 3000,
  nodeEnv: 'production',
  concurrencyLimit: 300,        // Max parallel requests
  requestTimeout: 3000,          // 3s timeout
  retryAttempts: 1,              // Fast fail
  retryDelay: 200,               // 200ms between retries
  maxTokensPerRequest: 3000,     // Up to 3k tokens per request
  maxRequestBodySize: '50mb',
  corsOrigin: '*',
  requireApiKey: true,
  apiKeys: [/* Your API keys */]
}
```

No `.env` file needed - everything is hardcoded for instant deployment.

## Project Structure

```
scanner/
├── src/
│   ├── config/
│   │   └── index.js                # Hardcoded config (no .env needed)
│   ├── controllers/
│   │   └── scan.controller.js      # Request handlers
│   ├── middleware/
│   │   ├── auth.js                 # API key authentication
│   │   ├── errorHandler.js         # Error handling
│   │   └── notFound.js             # 404 handler
│   ├── routes/
│   │   └── index.js                # Route definitions
│   ├── services/
│   │   ├── dexscreener.service.js  # DexScreener API integration
│   │   ├── jupiter.service.js      # Jupiter API for Solana
│   │   └── token.service.js        # Token orchestration
│   ├── utils/
│   │   ├── logger.js               # Logging utility
│   │   ├── proxyRotator.js         # Request spoofing (10 user agents)
│   │   └── rateLimiter.js          # Rate limit tracking
│   └── app.js                      # Express app setup
├── mass-deploy.js                  # Deploy 35+ instances to Vercel
├── load-balancer-client.js         # Distribute requests across endpoints
├── package.json                    # Dependencies
├── vercel.json                     # Vercel config
├── README.md                       # This file
└── server.js                       # Entry point
```

## How It Works

### Request Spoofing
The API rotates through 10 different user agents and adds random referers to avoid fingerprinting by DexScreener:

```javascript
// Rotates every 30 requests
getUserAgent() {
  if (this.requestCount % 30 === 0) {
    this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
  }
  return this.userAgents[this.currentUserAgentIndex];
}
```

This allows bypassing DexScreener's 300 req/min rate limit per IP.

### Multi-Chain Detection
Automatically detects chain and routes to the best API:

- **Solana tokens** (no `0x` prefix, 32-44 chars) → Jupiter API first, fallback to DexScreener
- **EVM tokens** (`0x` prefix) → DexScreener API

### Mass Deployment Strategy
Deploy 35+ instances to multiply rate limit capacity:

- 1 instance = 300 req/min
- 35 instances = 10,500 req/min
- 50 instances = 15,000 req/min

Each instance has hardcoded API keys and config for instant deployment.

## Data Sources

### DexScreener API
- **Endpoint:** `https://api.dexscreener.com/latest/dex/tokens/{address}`
- **Rate limit:** 300 requests/minute
- **Supports:** All EVM chains + Solana
- **Bypassed with:** Rotating user agents and referers

### Jupiter API
- **Endpoint:** `https://api.jup.ag/price/v2?ids={address}`
- **Rate limit:** No limit
- **Supports:** Solana only
- **Used for:** Solana tokens with fallback to DexScreener

## Troubleshooting

### "Payment required / DEPLOYMENT_DISABLED"
Your Vercel deployments have been disabled due to:
- Exceeded free tier limits (100 deployments/day or function execution limits)
- Too much bandwidth usage
- Account flagged for unusual traffic

**Solution:** Wait for limits to reset or upgrade to Vercel Pro.

### API returning stale data
Token prices can be volatile. The APIs may cache data for 5-30 seconds. For pump.fun tokens, prices can change drastically in minutes.

### 401 Unauthorized
Make sure you're including a valid API key header:
```bash
-H "X-API-Key: YOUR_API_KEY_HERE"
```

## License

MIT

## Repository

https://github.com/kidxbt/scanner
