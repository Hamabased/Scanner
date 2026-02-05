/**
 * Rate Limiter Utility
 * Manages API rate limits to prevent 429 errors
 */

class RateLimiter {
  constructor() {
    // DexScreener limit: 300 requests per minute
    this.dexScreenerLimit = 290; // Stay under 300 for safety
    this.dexScreenerRequests = [];
    this.windowMs = 60000; // 1 minute in milliseconds
  }

  /**
   * Check if we can make a DexScreener request
   * @returns {Object} { allowed: boolean, waitTime: number }
   */
  canMakeDexScreenerRequest() {
    const now = Date.now();

    // Remove requests older than 1 minute
    this.dexScreenerRequests = this.dexScreenerRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    // Check if we're under the limit
    if (this.dexScreenerRequests.length < this.dexScreenerLimit) {
      return { allowed: true, waitTime: 0 };
    }

    // Calculate wait time until oldest request expires
    const oldestRequest = this.dexScreenerRequests[0];
    const waitTime = this.windowMs - (now - oldestRequest);

    return { allowed: false, waitTime };
  }

  /**
   * Record a DexScreener request
   */
  recordDexScreenerRequest() {
    this.dexScreenerRequests.push(Date.now());
  }

  /**
   * Wait if necessary before making a DexScreener request
   * @returns {Promise<void>}
   */
  async waitForDexScreener() {
    const { allowed, waitTime } = this.canMakeDexScreenerRequest();

    if (!allowed) {
      console.log(`[RateLimiter] DexScreener rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s...`);
      await this.delay(waitTime + 100); // Add 100ms buffer
    }

    this.recordDexScreenerRequest();
  }

  /**
   * Reset rate limiter (useful for testing or manual reset)
   */
  reset() {
    this.dexScreenerRequests = [];
  }

  /**
   * Get current rate limit status
   * @returns {Object} Status object with current counts
   */
  getStatus() {
    const now = Date.now();

    // Clean old requests
    this.dexScreenerRequests = this.dexScreenerRequests.filter(
      timestamp => now - timestamp < this.windowMs
    );

    return {
      dexScreener: {
        current: this.dexScreenerRequests.length,
        limit: this.dexScreenerLimit,
        remaining: this.dexScreenerLimit - this.dexScreenerRequests.length,
        windowMs: this.windowMs
      }
    };
  }

  /**
   * Delay utility
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
module.exports = new RateLimiter();
