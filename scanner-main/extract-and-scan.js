/**
 * Extract token addresses from SQL dump and scan them
 */

const fs = require('fs');
const axios = require('axios');

const API_URL = 'http://localhost:3001';
const SQL_FILE = '/Users/kidxbt/ndew/kols_partial_dump.sql';
const OUTPUT_FILE = '/Users/kidxbt/ndew/token-scan-results.json';
const BATCH_SIZE = 500;

/**
 * Extract contract addresses from SQL file
 */
function extractContractAddresses(sqlContent) {
  const addresses = new Set();

  // Regex to find contract addresses in the JSON
  // Matches both uppercase and lowercase hex addresses (ETH/BSC/BASE) and Solana addresses
  const contractRegex = /"contract":"([a-zA-Z0-9]+)"/g;

  let match;
  while ((match = contractRegex.exec(sqlContent)) !== null) {
    const address = match[1];
    // Filter out obvious non-addresses (too short, etc)
    if (address.length >= 32) {
      addresses.add(address);
    }
  }

  return Array.from(addresses);
}

/**
 * Create batches of addresses
 */
function createBatches(addresses, batchSize) {
  const batches = [];
  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * Scan a batch of tokens
 */
async function scanBatch(tokens, batchIndex, totalBatches) {
  console.log(`\n📊 Scanning batch ${batchIndex + 1}/${totalBatches} (${tokens.length} tokens)...`);

  try {
    const response = await axios.post(`${API_URL}/scan`, {
      tokens: tokens
    }, {
      timeout: 60000 // 60 second timeout for large batches
    });

    console.log(`✅ Batch ${batchIndex + 1} completed in ${response.data.meta.durationMs}ms`);
    console.log(`   Active: ${response.data.meta.active}, Unbonded: ${response.data.meta.unbonded}`);

    return response.data;
  } catch (error) {
    console.error(`❌ Batch ${batchIndex + 1} failed:`, error.message);
    return null;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║   Token Address Extraction & Scanning     ║');
  console.log('╚════════════════════════════════════════════╝\n');

  // Step 1: Read SQL file
  console.log('📖 Reading SQL file...');
  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
  console.log(`   File size: ${(sqlContent.length / 1024 / 1024).toFixed(2)} MB`);

  // Step 2: Extract addresses
  console.log('\n🔍 Extracting contract addresses...');
  const addresses = extractContractAddresses(sqlContent);
  console.log(`   Found ${addresses.length} unique contract addresses`);

  // Show first few examples
  console.log('\n   Sample addresses:');
  addresses.slice(0, 5).forEach((addr, i) => {
    console.log(`   ${i + 1}. ${addr}`);
  });

  // Step 3: Create batches
  console.log(`\n📦 Creating batches of ${BATCH_SIZE} addresses...`);
  const batches = createBatches(addresses, BATCH_SIZE);
  console.log(`   Total batches: ${batches.length}`);

  // Step 4: Scan all batches
  console.log('\n🚀 Starting token scan...\n');
  const startTime = Date.now();

  const allResults = [];
  let totalActive = 0;
  let totalUnbonded = 0;

  for (let i = 0; i < batches.length; i++) {
    const result = await scanBatch(batches[i], i, batches.length);

    if (result) {
      allResults.push(...result.data);
      totalActive += result.meta.active;
      totalUnbonded += result.meta.unbonded;
    }

    // Small delay between batches to avoid overwhelming the API
    if (i < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  const totalDuration = Date.now() - startTime;

  // Step 5: Save results
  console.log('\n💾 Saving results to file...');
  const output = {
    timestamp: new Date().toISOString(),
    totalAddresses: addresses.length,
    totalScanned: allResults.length,
    totalActive: totalActive,
    totalUnbonded: totalUnbonded,
    durationMs: totalDuration,
    durationSeconds: (totalDuration / 1000).toFixed(2),
    results: allResults
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`   Saved to: ${OUTPUT_FILE}`);

  // Step 6: Summary
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║              Summary Report                ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\n📊 Total Addresses: ${addresses.length}`);
  console.log(`✅ Total Scanned: ${allResults.length}`);
  console.log(`🟢 Active Tokens: ${totalActive} (${((totalActive / allResults.length) * 100).toFixed(1)}%)`);
  console.log(`⚪ Unbonded Tokens: ${totalUnbonded} (${((totalUnbonded / allResults.length) * 100).toFixed(1)}%)`);
  console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`⚡ Avg per token: ${(totalDuration / allResults.length).toFixed(0)}ms`);

  // Top 10 tokens by liquidity
  const topByLiquidity = allResults
    .filter(t => t.status === 'active')
    .sort((a, b) => b.liquidityUSD - a.liquidityUSD)
    .slice(0, 10);

  if (topByLiquidity.length > 0) {
    console.log('\n🏆 Top 10 Tokens by Liquidity:');
    topByLiquidity.forEach((token, i) => {
      console.log(`   ${i + 1}. ${token.symbol} - $${token.liquidityUSD.toLocaleString()} (${token.source})`);
    });
  }

  console.log('\n✅ All done!\n');
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
