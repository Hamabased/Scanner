/**
 * Proxy Rotator & Request Spoofing
 * Bypasses rate limits by rotating IPs and user agents
 */

const axios = require('axios');

class ProxyRotator {
  constructor() {
    // Rotating user agents to avoid detection
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
      'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64; rv:109.0) Gecko/20100101 Firefox/120.0'
    ];

    this.currentUserAgentIndex = 0;
    this.requestCount = 0;
  }

  /**
   * Get rotating user agent
   * Changes every 30 requests to avoid pattern detection
   */
  getUserAgent() {
    if (this.requestCount % 30 === 0) {
      this.currentUserAgentIndex = (this.currentUserAgentIndex + 1) % this.userAgents.length;
    }
    this.requestCount++;
    return this.userAgents[this.currentUserAgentIndex];
  }

  /**
   * Create axios instance with rotation
   * Each request gets different headers to bypass fingerprinting
   */
  createAxiosInstance() {
    return axios.create({
      headers: {
        'User-Agent': this.getUserAgent(),
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        // Randomize referer to look like real traffic
        'Referer': this.getRandomReferer()
      }
    });
  }

  /**
   * Get random referer to look organic
   */
  getRandomReferer() {
    const referers = [
      'https://dexscreener.com/',
      'https://www.coingecko.com/',
      'https://coinmarketcap.com/',
      'https://www.dextools.io/',
      'https://birdeye.so/'
    ];
    return referers[Math.floor(Math.random() * referers.length)];
  }

  /**
   * Add jitter delay to avoid pattern detection
   * Random delay between requests
   */
  async jitterDelay() {
    const delay = Math.floor(Math.random() * 50) + 10; // 10-60ms
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Reset counter (useful for testing)
   */
  reset() {
    this.requestCount = 0;
    this.currentUserAgentIndex = 0;
  }
}

module.exports = new ProxyRotator();
