/**
 * DexScreener API Service
 * Handles fetching token data from DexScreener
 */

const proxyRotator = require('../utils/proxyRotator');
const config = require('../config');

class DexScreenerService {
  constructor() {
    this.baseUrl = config.dexScreenerBaseUrl;
    this.timeout = config.requestTimeout;
  }

  /**
   * Fetch token data from DexScreener API
   * @param {string} address - Token contract address
   * @param {number} retries - Number of retries remaining
   * @returns {Promise<Object>} Token data with fallback to UNKNOWN
   */
  async fetchTokenData(address, retries = config.retryAttempts) {
    try {
      // Add jitter to avoid pattern detection
      await proxyRotator.jitterDelay();

      // Create axios instance with rotating headers
      const axiosInstance = proxyRotator.createAxiosInstance();

      const response = await axiosInstance.get(
        `${this.baseUrl}/tokens/${address}`,
        {
          timeout: this.timeout
        }
      );

      if (!response.data || !response.data.pairs || response.data.pairs.length === 0) {
        // Return default data instead of null
        return {
          symbol: 'UNKNOWN',
          marketCapUSD: 0,
          liquidityUSD: 0,
          chain: 'unknown'
        };
      }

      // Get the pair with highest liquidity
      const pair = response.data.pairs.reduce((max, p) =>
        (p.liquidity?.usd || 0) > (max.liquidity?.usd || 0) ? p : max
      );

      return this.formatTokenData(address, pair);
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(config.retryDelay);
        return this.fetchTokenData(address, retries - 1);
      }
      // Return default data instead of throwing
      return {
        symbol: 'UNKNOWN',
        marketCapUSD: 0,
        liquidityUSD: 0,
        chain: 'unknown'
      };
    }
  }

  /**
   * Format DexScreener API response to standard format
   * @param {string} address - Token address
   * @param {Object} pair - DexScreener pair data
   * @returns {Object} Formatted token data
   */
  formatTokenData(address, pair) {
    return {
      symbol: pair.baseToken?.symbol || 'UNKNOWN',
      marketCapUSD: parseFloat(pair.fdv || pair.marketCap) || 0,
      liquidityUSD: parseFloat(pair.liquidity?.usd) || 0,
      chain: pair.chainId || 'unknown'
    };
  }

  /**
   * Check if error is retryable
   * @param {Error} error - Error object
   * @returns {boolean} True if error is retryable
   */
  isRetryableError(error) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      return true;
    }
    if (error.response) {
      const status = error.response.status;
      return status === 429 || status >= 500;
    }
    return false;
  }

  /**
   * Delay utility for retries
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new DexScreenerService();
