/**
 * Birdeye API Service
 * Handles fetching token data from Birdeye (Solana)
 */

const axios = require('axios');
const config = require('../config');

class BirdeyeService {
  constructor() {
    this.baseUrl = config.birdeyeBaseUrl;
    this.timeout = config.requestTimeout;
  }

  /**
   * Fetch token data from Birdeye API
   * @param {string} address - Token contract address
   * @param {number} retries - Number of retries remaining
   * @returns {Promise<Object|null>} Token data or null if not found
   */
  async fetchTokenData(address, retries = config.retryAttempts) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/token/${address}`,
        {
          timeout: this.timeout,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'TokenScannerAPI/1.0'
          }
        }
      );

      if (!response.data || !response.data.data) {
        return null;
      }

      return this.formatTokenData(address, response.data.data);
    } catch (error) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(config.retryDelay);
        return this.fetchTokenData(address, retries - 1);
      }
      throw error;
    }
  }

  /**
   * Format Birdeye API response to standard format
   * @param {string} address - Token address
   * @param {Object} data - Birdeye token data
   * @returns {Object} Formatted token data
   */
  formatTokenData(address, data) {
    return {
      symbol: data.symbol || 'UNKNOWN',
      marketCapUSD: parseFloat(data.mc) || 0,
      liquidityUSD: parseFloat(data.liquidity) || 0
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

module.exports = new BirdeyeService();
