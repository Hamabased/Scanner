/**
 * Load Balancer Client
 * Distributes requests across 30 API instances
 * Each instance can handle 300 req/min = 9,000 total req/min
 */

const axios = require('axios');
const fs = require('fs');

class LoadBalancerClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.endpoints = [];
    this.currentIndex = 0;
    this.requestCounts = {}; // Track requests per endpoint
  }

  /**
   * Load endpoints from deployment-urls.txt
   */
  loadEndpoints() {
    try {
      const content = fs.readFileSync('./deployment-urls.txt', 'utf8');
      const lines = content.split('\n').filter(line => line.trim());

      this.endpoints = lines.map(line => {
        const match = line.match(/https:\/\/[^\s]+/);
        return match ? match[0] : null;
      }).filter(url => url !== null);

      console.log(`✅ Loaded ${this.endpoints.length} API endpoints`);

      // Initialize request counts
      this.endpoints.forEach(endpoint => {
        this.requestCounts[endpoint] = 0;
      });
    } catch (error) {
      console.error('❌ Error loading endpoints:', error.message);
      console.log('Make sure deployment-urls.txt exists with your API URLs');
    }
  }

  /**
   * Add endpoints manually (if deployment-urls.txt doesn't exist yet)
   */
  addEndpoint(url) {
    this.endpoints.push(url);
    this.requestCounts[url] = 0;
  }

  /**
   * Get next endpoint using round-robin
   */
  getNextEndpoint() {
    if (this.endpoints.length === 0) {
      throw new Error('No endpoints available');
    }

    const endpoint = this.endpoints[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.endpoints.length;
    return endpoint;
  }

  /**
   * Get endpoint with least requests (for better distribution)
   */
  getLeastUsedEndpoint() {
    if (this.endpoints.length === 0) {
      throw new Error('No endpoints available');
    }

    let minCount = Infinity;
    let leastUsed = this.endpoints[0];

    for (const endpoint of this.endpoints) {
      if (this.requestCounts[endpoint] < minCount) {
        minCount = this.requestCounts[endpoint];
        leastUsed = endpoint;
      }
    }

    return leastUsed;
  }

  /**
   * Scan tokens using load balancing
   */
  async scanTokens(tokens, strategy = 'round-robin') {
    const endpoint = strategy === 'least-used'
      ? this.getLeastUsedEndpoint()
      : this.getNextEndpoint();

    this.requestCounts[endpoint]++;

    try {
      const response = await axios.post(
        `${endpoint}/scan`,
        { tokens },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': this.apiKey
          },
          timeout: 60000
        }
      );

      return {
        success: true,
        data: response.data,
        endpoint
      };
    } catch (error) {
      console.error(`❌ Error from ${endpoint}:`, error.message);
      return {
        success: false,
        error: error.message,
        endpoint
      };
    }
  }

  /**
   * Batch scan with automatic chunking and load balancing
   */
  async batchScan(allTokens, chunkSize = 100) {
    const chunks = [];
    for (let i = 0; i < allTokens.length; i += chunkSize) {
      chunks.push(allTokens.slice(i, i + chunkSize));
    }

    console.log(`📦 Split ${allTokens.length} tokens into ${chunks.length} chunks of ${chunkSize}`);
    console.log(`🔄 Distributing across ${this.endpoints.length} endpoints...`);

    const startTime = Date.now();
    const results = [];

    // Process chunks in parallel
    const promises = chunks.map((chunk, index) =>
      this.scanTokens(chunk, 'least-used').then(result => ({
        chunkIndex: index,
        result
      }))
    );

    const chunkResults = await Promise.all(promises);

    // Combine results in order
    chunkResults.sort((a, b) => a.chunkIndex - b.chunkIndex);

    for (const { result } of chunkResults) {
      if (result.success) {
        results.push(...result.data.data);
      }
    }

    const duration = (Date.now() - startTime) / 1000;

    console.log(`✅ Completed ${allTokens.length} tokens in ${duration.toFixed(2)}s`);
    console.log(`🚀 Average speed: ${(allTokens.length / duration).toFixed(0)} tokens/second`);

    // Show request distribution
    console.log('\n📊 Request distribution:');
    for (const endpoint of this.endpoints) {
      const shortUrl = endpoint.replace('https://', '').substring(0, 30);
      console.log(`  ${shortUrl}: ${this.requestCounts[endpoint]} requests`);
    }

    return results;
  }

  /**
   * Get statistics
   */
  getStats() {
    const totalRequests = Object.values(this.requestCounts).reduce((a, b) => a + b, 0);
    return {
      totalEndpoints: this.endpoints.length,
      totalRequests,
      requestsPerEndpoint: this.requestCounts,
      capacity: this.endpoints.length * 300 // 300 req/min per endpoint
    };
  }
}

module.exports = LoadBalancerClient;

// CLI usage example
if (require.main === module) {
  const client = new LoadBalancerClient('1f93e75362c62a31f4e0f8df73c5c549c84c00919a2f9327eb57515a55c5b1d9');

  // Try to load endpoints from file
  client.loadEndpoints();

  // If no endpoints loaded, add them manually (example)
  if (client.endpoints.length === 0) {
    console.log('⚠️  No endpoints found in deployment-urls.txt');
    console.log('Add your Vercel URLs manually or run ./deploy-multiple.sh first');
  }

  console.log(`\n🔥 Load Balancer Ready!`);
  console.log(`📡 ${client.endpoints.length} endpoints available`);
  console.log(`⚡ Total capacity: ${client.endpoints.length * 300} requests/minute\n`);
}
