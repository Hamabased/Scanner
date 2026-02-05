/**
 * Token Service
 * Orchestrates fetching token data from multiple sources with fallback logic
 */

const pLimit = require('p-limit');
const dexScreenerService = require('./dexscreener.service');
const jupiterService = require('./jupiter.service');
const config = require('../config');
const logger = require('../utils/logger');

class TokenService {
  constructor() {
    this.limit = pLimit(config.concurrencyLimit);
  }

  /**
   * Fetch token data with fallback logic
   * @param {string} address - Token contract address
   * @returns {Promise<Object>} Token data
   */
  async fetchTokenData(address) {
    try {
      // Check if it's a Solana address (base58, typically 32-44 chars, no 0x prefix)
      const isSolana = !address.startsWith('0x') && address.length >= 32;

      if (isSolana) {
        // For Solana tokens, try Jupiter API first
        try {
          let data = await jupiterService.fetchTokenData(address);
          if (data && data.symbol && data.symbol !== 'UNKNOWN') {
            return {
              address: address,
              symbol: data.symbol,
              marketCapUSD: data.marketCapUSD,
              liquidityUSD: data.liquidityUSD,
              chain: data.chain
            };
          }
        } catch (jupiterError) {
          logger.debug(`Jupiter failed for ${address}, trying DexScreener: ${jupiterError.message}`);
        }
      }

      // For all other chains or if Jupiter fails, use DexScreener
      try {
        let data = await dexScreenerService.fetchTokenData(address);
        if (data && data.symbol && data.symbol !== 'UNKNOWN') {
          return {
            address: address,
            symbol: data.symbol,
            marketCapUSD: data.marketCapUSD,
            liquidityUSD: data.liquidityUSD,
            chain: data.chain
          };
        }
      } catch (dexError) {
        logger.debug(`DexScreener failed for ${address}: ${dexError.message}`);
      }

      // If both APIs fail or return null, return default data
      return {
        address: address,
        symbol: 'UNKNOWN',
        marketCapUSD: 0,
        liquidityUSD: 0,
        chain: 'unknown'
      };
    } catch (error) {
      logger.error(`Failed to fetch data for ${address}: ${error.message}`);

      // Always return default data structure, never null
      return {
        address: address,
        symbol: 'UNKNOWN',
        marketCapUSD: 0,
        liquidityUSD: 0,
        chain: 'unknown'
      };
    }
  }

  /**
   * Scan multiple tokens with concurrency limiting
   * @param {string[]} tokens - Array of token addresses
   * @returns {Promise<Object>} Scan results with metadata
   */
  async scanTokens(tokens) {
    const startTime = Date.now();

    logger.info(`Starting scan for ${tokens.length} tokens with concurrency limit of ${config.concurrencyLimit}`);

    // Fetch all token data with concurrency limiting
    const results = await Promise.all(
      tokens.map((address, index) =>
        this.limit(async () => {
          const data = await this.fetchTokenData(address);

          // Log progress every 50 tokens
          if ((index + 1) % 50 === 0) {
            logger.info(`Processed ${index + 1}/${tokens.length} tokens`);
          }

          return data;
        })
      )
    );

    const durationMs = Date.now() - startTime;

    logger.info(`Completed in ${durationMs}ms`);

    return {
      success: true,
      data: results
    };
  }

  /**
   * Validate token addresses
   * @param {string[]} tokens - Array of token addresses
   * @returns {Object} Validation result
   */
  validateTokens(tokens) {
    if (!tokens || !Array.isArray(tokens)) {
      return {
        valid: false,
        error: 'Invalid request: "tokens" must be an array of token addresses'
      };
    }

    if (tokens.length === 0) {
      return {
        valid: false,
        error: 'Invalid request: "tokens" array cannot be empty'
      };
    }

    if (tokens.length > config.maxTokensPerRequest) {
      return {
        valid: false,
        error: `Invalid request: Maximum ${config.maxTokensPerRequest} tokens allowed per request`
      };
    }

    return { valid: true };
  }
}

module.exports = new TokenService();
