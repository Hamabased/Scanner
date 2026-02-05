/**
 * Jupiter API Service (for Solana tokens)
 * Handles fetching token data from Jupiter
 */

const axios = require('axios');
const config = require('../config');

class JupiterService {
  constructor() {
    this.baseUrl = 'https://datapi.jup.ag/v1/assets';
    this.timeout = config.requestTimeout;
  }

  /**
   * Fetch token data from Jupiter API
   * @param {string} address - Token contract address
   * @param {number} retries - Number of retries remaining
   * @returns {Promise<Object>} Token data with fallback to UNKNOWN
   */
  async fetchTokenData(address, retries = config.retryAttempts) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/search?query=${address}`,
        {
          timeout: this.timeout,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TokenScannerAPI/1.0'
          }
        }
      );

      if (!response.data || response.data.length === 0) {
        // Return default data instead of null
        return {
          symbol: 'UNKNOWN',
          marketCapUSD: 0,
          liquidityUSD: 0,
          chain: 'solana'
        };
      }

      // Get first result (exact match)
      const token = response.data[0];

      return this.formatTokenData(token);
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
        chain: 'solana'
      };
    }
  }

  /**
   * Format Jupiter API response to standard format
   * @param {Object} token - Jupiter token data
   * @returns {Object} Formatted token data
   */
  formatTokenData(token) {
    return {
      symbol: token.symbol || 'UNKNOWN',
      marketCapUSD: parseFloat(token.mcap) || 0,
      liquidityUSD: parseFloat(token.liquidity) || 0,
      chain: 'solana'
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

module.exports = new JupiterService();
