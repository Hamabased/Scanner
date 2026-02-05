/**
 * Sample Request Script
 * Demonstrates how to use the Token Scanner API
 */

const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3001';

// Sample token addresses (mix of chains for demonstration)
const SAMPLE_TOKENS = [
  // Ethereum tokens
  '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC

  // Solana tokens
  'So11111111111111111111111111111111111111112', // SOL
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC (Solana)
];

async function testHealthEndpoint() {
  console.log('\n📊 Testing /health endpoint...\n');

  try {
    const response = await axios.get(`${API_URL}/health`);
    console.log('✅ Health Check Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

async function testScanEndpoint(tokens = SAMPLE_TOKENS) {
  console.log(`\n🔍 Testing /scan endpoint with ${tokens.length} tokens...\n`);

  const startTime = Date.now();

  try {
    const response = await axios.post(`${API_URL}/scan`, {
      tokens: tokens
    });

    const duration = Date.now() - startTime;

    console.log('✅ Scan Response:');
    console.log(`\nMetadata: ${JSON.stringify(response.data.meta, null, 2)}`);
    console.log(`\nActual Duration: ${duration}ms`);

    // Show first few results
    console.log('\nSample Results (first 3):');
    response.data.data.slice(0, 3).forEach((token, index) => {
      console.log(`\n${index + 1}. ${token.symbol} (${token.address})`);
      console.log(`   Price: $${token.priceUSD}`);
      console.log(`   Liquidity: $${token.liquidityUSD.toLocaleString()}`);
      console.log(`   Market Cap: $${token.marketCapUSD.toLocaleString()}`);
      console.log(`   Status: ${token.status}`);
      console.log(`   Source: ${token.source}`);
      if (token.chainId) console.log(`   Chain: ${token.chainId}`);
    });

    // Show statistics
    const active = response.data.data.filter(t => t.status === 'active');
    const unbonded = response.data.data.filter(t => t.status === 'unbonded');

    console.log('\n📈 Statistics:');
    console.log(`   Total: ${response.data.data.length}`);
    console.log(`   Active: ${active.length}`);
    console.log(`   Unbonded: ${unbonded.length}`);

  } catch (error) {
    console.error('❌ Scan failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

async function testErrorHandling() {
  console.log('\n⚠️  Testing error handling...\n');

  // Test 1: Empty array
  try {
    await axios.post(`${API_URL}/scan`, { tokens: [] });
  } catch (error) {
    console.log('✅ Empty array error caught:');
    console.log('   ', error.response?.data?.error || error.message);
  }

  // Test 2: Invalid input
  try {
    await axios.post(`${API_URL}/scan`, { tokens: 'not-an-array' });
  } catch (error) {
    console.log('✅ Invalid input error caught:');
    console.log('   ', error.response?.data?.error || error.message);
  }

  // Test 3: Too many tokens
  try {
    const tooMany = Array(501).fill('0x0000000000000000000000000000000000000000');
    await axios.post(`${API_URL}/scan`, { tokens: tooMany });
  } catch (error) {
    console.log('✅ Too many tokens error caught:');
    console.log('   ', error.response?.data?.error || error.message);
  }
}

async function runAllTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Token Scanner API - Sample Requests     ║');
  console.log('╚════════════════════════════════════════════╝');

  await testHealthEndpoint();
  await testScanEndpoint();
  await testErrorHandling();

  console.log('\n✅ All tests completed!\n');
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
