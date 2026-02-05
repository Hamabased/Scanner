#!/usr/bin/env node

/**
 * Mass Deployment Script for Vercel
 * Deploys multiple instances of the token scanner API
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const NUM_DEPLOYMENTS = 95;
const PROJECT_PREFIX = 'token-scanner-api';
const OUTPUT_FILE = 'deployed-endpoints.txt';

async function deploy() {
  console.log(`🚀 Starting mass deployment of ${NUM_DEPLOYMENTS} instances...\n`);

  const deployedUrls = [];

  for (let i = 1; i <= NUM_DEPLOYMENTS; i++) {
    console.log(`[${i}/${NUM_DEPLOYMENTS}] Deploying instance ${i}...`);

    try {
      // Deploy with unique project name (no env vars needed - everything hardcoded)
      const deployCommand = `vercel --prod --yes --name ${PROJECT_PREFIX}-${i}`;

      const output = execSync(deployCommand, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Extract URL from output
      const urlMatch = output.match(/https:\/\/[^\s]+/);
      if (urlMatch) {
        const url = urlMatch[0];
        deployedUrls.push(url);
        console.log(`✅ Deployed: ${url}\n`);
      } else {
        console.log(`⚠️  Deployment ${i} completed but URL not found in output\n`);
      }

      // Small delay to avoid rate limiting
      if (i < NUM_DEPLOYMENTS) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Failed to deploy instance ${i}:`, error.message);
      console.log('Continuing with next deployment...\n');
    }
  }

  // Save all deployed URLs to file
  console.log(`\n📝 Saving ${deployedUrls.length} endpoints to ${OUTPUT_FILE}...`);

  let fileContent = `# Token Scanner API - Deployed Endpoints\n`;
  fileContent += `# Total: ${deployedUrls.length} instances\n`;
  fileContent += `# Each endpoint can handle 300 req/min\n`;
  fileContent += `# Combined capacity: ${deployedUrls.length * 300} req/min\n\n`;

  deployedUrls.forEach((url, index) => {
    fileContent += `${url}\n`;
  });

  fileContent += `\n# Sample Request:\n`;
  fileContent += `# curl -s ${deployedUrls[0] || 'https://your-endpoint.vercel.app'}/scan -X POST -H "Content-Type: application/json" -H "X-API-Key: 1f93e75362c62a31f4e0f8df73c5c549c84c00919a2f9327eb57515a55c5b1d9" -d '{"tokens":["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"]}'\n`;

  fs.writeFileSync(path.join(__dirname, OUTPUT_FILE), fileContent);

  console.log(`\n✨ Deployment complete!`);
  console.log(`📊 Successfully deployed: ${deployedUrls.length}/${NUM_DEPLOYMENTS}`);
  console.log(`📄 Endpoints saved to: ${OUTPUT_FILE}`);
  console.log(`\n🎯 Total capacity: ${deployedUrls.length * 300} requests/minute`);
}

deploy().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
