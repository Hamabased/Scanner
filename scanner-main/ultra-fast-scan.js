/**
 * ULTRA FAST token scanner - NO MERCY MODE
 * Scans 19k tokens in under 1 minute
 */

const fs = require('fs');
const axios = require('axios');

const API_URL = 'http://localhost:3001';
const SQL_FILE = '/Users/kidxbt/ndew/kols_partial_dump.sql';
const OUTPUT_FILE = '/Users/kidxbt/ndew/token-scan-results.json';
const BATCH_SIZE = 500;

function extractContractAddresses(sqlContent) {
  const addresses = new Set();
  const contractRegex = /"contract":"([a-zA-Z0-9]+)"/g;
  let match;
  while ((match = contractRegex.exec(sqlContent)) !== null) {
    const address = match[1];
    if (address.length >= 32) {
      addresses.add(address);
    }
  }
  return Array.from(addresses);
}

function createBatches(addresses, batchSize) {
  const batches = [];
  for (let i = 0; i < addresses.length; i += batchSize) {
    batches.push(addresses.slice(i, i + batchSize));
  }
  return batches;
}

async function scanBatch(tokens, batchIndex, totalBatches) {
  try {
    const response = await axios.post(`${API_URL}/scan`, { tokens }, { timeout: 120000 });
    return response.data;
  } catch (error) {
    console.error(`❌ Batch ${batchIndex + 1} failed:`, error.message);
    return null;
  }
}

async function main() {
  console.log('⚡ ULTRA FAST MODE - SCANNING 19K TOKENS ⚡\n');

  const startTime = Date.now();

  // Extract addresses
  console.log('📖 Reading SQL file...');
  const sqlContent = fs.readFileSync(SQL_FILE, 'utf8');

  console.log('🔍 Extracting addresses...');
  const addresses = extractContractAddresses(sqlContent);
  console.log(`   Found ${addresses.length} addresses\n`);

  const batches = createBatches(addresses, BATCH_SIZE);
  console.log(`🚀 Firing ${batches.length} batches with 200 concurrent requests each!\n`);

  // FIRE ALL BATCHES IN PARALLEL - NO WAITING
  const batchPromises = batches.map((batch, index) =>
    scanBatch(batch, index, batches.length)
      .then(result => {
        if (result) {
          console.log(`✅ Batch ${index + 1}/${batches.length} done - Active: ${result.meta.active}, Time: ${result.meta.durationMs}ms`);
        }
        return result;
      })
  );

  console.log('⏳ Waiting for all batches to complete...\n');
  const results = await Promise.all(batchPromises);

  const allResults = [];
  let totalActive = 0;
  let totalUnbonded = 0;

  results.forEach(result => {
    if (result) {
      allResults.push(...result.data);
      totalActive += result.meta.active;
      totalUnbonded += result.meta.unbonded;
    }
  });

  const totalDuration = Date.now() - startTime;

  // Save results
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

  // Summary
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║         ⚡ ULTRA FAST SCAN COMPLETE ⚡      ║');
  console.log('╚════════════════════════════════════════════╝\n');
  console.log(`📊 Total: ${addresses.length} addresses`);
  console.log(`✅ Scanned: ${allResults.length}`);
  console.log(`🟢 Active: ${totalActive} (${((totalActive / allResults.length) * 100).toFixed(1)}%)`);
  console.log(`⚪ Unbonded: ${totalUnbonded} (${((totalUnbonded / allResults.length) * 100).toFixed(1)}%)`);
  console.log(`⚡ TOTAL TIME: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log(`🚀 Speed: ${(allResults.length / (totalDuration / 1000)).toFixed(0)} tokens/sec\n`);

  // Top tokens
  const topByLiquidity = allResults
    .filter(t => t.status === 'active')
    .sort((a, b) => b.liquidityUSD - a.liquidityUSD)
    .slice(0, 10);

  if (topByLiquidity.length > 0) {
    console.log('🏆 Top 10 by Liquidity:');
    topByLiquidity.forEach((token, i) => {
      console.log(`   ${i + 1}. ${token.symbol.padEnd(10)} $${token.liquidityUSD.toLocaleString().padEnd(15)} MC: $${token.marketCapUSD.toLocaleString()}`);
    });
  }

  // Top by market cap (including unbonded)
  const topByMarketCap = allResults
    .filter(t => t.marketCapUSD > 0)
    .sort((a, b) => b.marketCapUSD - a.marketCapUSD)
    .slice(0, 10);

  if (topByMarketCap.length > 0) {
    console.log('\n💎 Top 10 by Market Cap:');
    topByMarketCap.forEach((token, i) => {
      console.log(`   ${i + 1}. ${token.symbol.padEnd(10)} $${token.marketCapUSD.toLocaleString().padEnd(15)} ${token.status}`);
    });
  }

  console.log(`\n💾 Results saved to: ${OUTPUT_FILE}\n`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
