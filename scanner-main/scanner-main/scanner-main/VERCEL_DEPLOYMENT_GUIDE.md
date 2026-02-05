# Vercel Deployment Guide

A comprehensive guide to deploying the Token Market Data Scanner API to Vercel, including single deployments, mass deployments, and troubleshooting.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Single Deployment](#single-deployment)
- [Mass Deployment](#mass-deployment)
- [Vercel Configuration](#vercel-configuration)
- [Environment Variables](#environment-variables)
- [Monitoring Deployments](#monitoring-deployments)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

---

## Prerequisites

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

Follow the prompts to authenticate with your Vercel account (GitHub, GitLab, Bitbucket, or email).

### 3. Verify Installation

```bash
vercel --version
```

---

## Single Deployment

### Quick Deploy

From the project directory:

```bash
# Deploy to production
vercel --prod

# Or deploy to preview (testing)
vercel
```

The CLI will guide you through:
1. Selecting or creating a project
2. Configuring project settings
3. Deploying your application

### Step-by-Step Single Deployment

**1. Navigate to project directory:**
```bash
cd /path/to/token-scanner-api
```

**2. Initialize Vercel project (first time only):**
```bash
vercel
```

Answer the setup questions:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account/team
- **Link to existing project?** → No
- **Project name?** → Accept default or customize
- **Directory?** → `./` (current directory)
- **Override settings?** → No

**3. Deploy to production:**
```bash
vercel --prod --yes
```

**4. Save the deployment URL:**

Vercel will output a URL like:
```
https://your-project.vercel.app
```

Save this for API requests.

---

## Mass Deployment

Deploy multiple instances to multiply your rate limit capacity (50 instances = 15,000 requests/minute).

### Method 1: Using the Deployment Script

**1. Review the deployment script:**

```bash
cat deploy-multiple.sh
```

**2. Customize deployment count:**

Edit the script to change the number of instances:
```bash
# Edit the for loop range
for i in {1..30}  # Change 30 to your desired count
```

**3. Run the script:**

```bash
chmod +x deploy-multiple.sh
./deploy-multiple.sh
```

The script will:
- Deploy N instances with unique names (api1, api2, api3, etc.)
- Collect all deployment URLs
- Save URLs to `deployment-urls.txt`
- Display total capacity

**Example output:**
```
🚀 Starting mass deployment of 30 API instances to Vercel...
================================================================

📦 Deploying instance 1/30 (api1)...
✅ api1 deployed: https://api1-abc123.vercel.app

📦 Deploying instance 2/30 (api2)...
✅ api2 deployed: https://api2-def456.vercel.app

...

================================================================
✅ DEPLOYMENT COMPLETE!
================================================================

🔥 You now have 30 API instances!
🔥 Total capacity: 9,000 requests/minute
```

### Method 2: Manual Mass Deployment

Deploy manually with a bash one-liner:

```bash
for i in {1..50}; do
  echo "Deploying instance $i..."
  vercel --prod --yes --name "scanner-api-$i"
  sleep 2
done
```

### Method 3: Using Node.js Script

If `mass-deploy.js` exists:

```bash
node mass-deploy.js
```

This script automates the entire process programmatically.

---

## Vercel Configuration

### vercel.json Structure

The `vercel.json` file configures your deployment:

```json
{
  "version": 2,
  "env": {
    "NODE_ENV": "production"
  },
  "functions": {
    "server.js": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```

**Key settings:**

| Setting | Value | Description |
|---------|-------|-------------|
| `version` | 2 | Vercel platform version |
| `env.NODE_ENV` | production | Environment mode |
| `maxDuration` | 60 | Function timeout (seconds) |
| `memory` | 1024 | Memory allocation (MB) |

### Customizing Configuration

**Increase timeout for large batches:**
```json
{
  "functions": {
    "server.js": {
      "maxDuration": 300,  // 5 minutes (Pro plan required)
      "memory": 3008       // Max memory (Pro plan)
    }
  }
}
```

**Add custom domains:**
```json
{
  "alias": ["api.yourdomain.com"]
}
```

---

## Environment Variables

### Using Hardcoded Config (Recommended)

This project uses hardcoded configuration in `src/config/index.js` - no environment variables needed for basic deployment.

### Adding Environment Variables (Optional)

**Via Vercel CLI:**

```bash
# Set a single variable
vercel env add API_KEY

# Set for specific environment
vercel env add API_KEY production
```

**Via Vercel Dashboard:**

1. Go to your project on vercel.com
2. Settings → Environment Variables
3. Add variable name and value
4. Select environments (Production, Preview, Development)
5. Save

**Via vercel.json:**

```json
{
  "env": {
    "NODE_ENV": "production",
    "API_KEY": "@api-key-secret"
  }
}
```

**Note:** Secrets must be created first:
```bash
vercel secrets add api-key-secret "your-actual-key"
```

---

## Monitoring Deployments

### List All Deployments

```bash
# List all deployments
vercel ls

# List for specific project
vercel ls my-project
```

### Check Deployment Status

```bash
# Get deployment details
vercel inspect <deployment-url>
```

### View Logs

```bash
# View production logs
vercel logs <deployment-url>

# Follow logs in real-time
vercel logs <deployment-url> --follow
```

### Test Deployment

After deploying, test the endpoint:

```bash
curl -X POST https://your-deployment.vercel.app/scan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -d '{
    "tokens": [
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      "So11111111111111111111111111111111111111112"
    ]
  }'
```

### Health Check

```bash
curl https://your-deployment.vercel.app/health
```

---

## Troubleshooting

### Common Issues

#### 1. "Payment Required / DEPLOYMENT_DISABLED"

**Cause:** Exceeded free tier limits or account suspended.

**Solutions:**
- Wait 24 hours for limits to reset
- Upgrade to Vercel Pro ($20/month)
- Check usage: `vercel teams switch` → View dashboard
- Contact Vercel support if flagged incorrectly

**Free tier limits:**
- 100 deployments per day
- 100 GB bandwidth per month
- 10s max function duration

#### 2. "Build Failed" or "Error: Command failed"

**Cause:** Missing dependencies or build errors.

**Solutions:**
```bash
# Ensure all dependencies are in package.json
npm install

# Test build locally
npm start

# Clear Vercel cache and redeploy
vercel --prod --force
```

#### 3. "Function Execution Timeout"

**Cause:** Function exceeds max duration (10s free, 60s Pro).

**Solutions:**
- Reduce `maxTokensPerRequest` in config
- Lower `concurrencyLimit` to reduce memory usage
- Upgrade to Pro plan for 300s max duration
- Split large requests into smaller batches

#### 4. "API Key Authentication Failed"

**Cause:** API keys not properly configured.

**Solutions:**
- Verify API keys in `src/config/index.js`
- Ensure `requireApiKey: true` is set
- Check request headers include `X-API-Key` or `Authorization`
- Redeploy after config changes

#### 5. "Too Many Requests (429)"

**Cause:** Hit DexScreener rate limit.

**Solutions:**
- Deploy more instances to distribute load
- Increase delay between requests
- User agent rotation is working (check logs)
- Use load balancer to distribute across instances

#### 6. "Cannot find module 'express'"

**Cause:** Dependencies not installed during deployment.

**Solutions:**
```bash
# Ensure package.json exists in root
ls -la package.json

# Verify dependencies
npm install

# Commit package-lock.json
git add package-lock.json
git commit -m "Add package-lock.json"

# Redeploy
vercel --prod
```

---

## Best Practices

### 1. Project Organization

```
your-project/
├── src/                    # Source code
├── server.js               # Entry point
├── package.json            # Dependencies
├── vercel.json             # Vercel config
├── .gitignore              # Ignore node_modules, .env
└── deploy-multiple.sh      # Mass deployment script
```

### 2. Git Integration

**Connect to GitHub for automatic deployments:**

1. Push code to GitHub
2. Import project on vercel.com
3. Enable automatic deployments
4. Every push to `main` = automatic production deploy

### 3. Multiple Environments

**Use separate projects for staging/production:**

```bash
# Deploy to staging
vercel --prod --name "scanner-api-staging"

# Deploy to production
vercel --prod --name "scanner-api-production"
```

### 4. Custom Domains

**Add custom domain via CLI:**

```bash
vercel domains add api.yourdomain.com
vercel alias set your-deployment.vercel.app api.yourdomain.com
```

### 5. Security

- Never commit API keys to git
- Use Vercel secrets for sensitive data
- Enable CORS only for trusted origins
- Rotate API keys regularly
- Monitor usage for unusual activity

### 6. Performance Optimization

- Use `memory: 1024` or higher for large batches
- Set appropriate `maxDuration` based on request size
- Deploy multiple instances for high traffic
- Use load balancer client for distribution
- Monitor function execution time

### 7. Cost Management

**Free tier tips:**
- Deploy 3-5 instances max to avoid hitting limits
- Use preview deployments for testing
- Delete old deployments: `vercel rm <deployment>`
- Monitor bandwidth usage

**Pro plan benefits:**
- Unlimited deployments
- 1TB bandwidth
- 300s function duration
- Custom domains
- Team collaboration

---

## Quick Reference

### Essential Commands

```bash
# Deploy to production
vercel --prod

# Deploy with auto-confirm
vercel --prod --yes

# Deploy with custom name
vercel --prod --name "my-api"

# List deployments
vercel ls

# View logs
vercel logs <deployment-url>

# Remove deployment
vercel rm <deployment-url>

# Check project info
vercel inspect

# List environment variables
vercel env ls
```

### Deployment URLs

After deployment, save URLs in a file:

```bash
# Append to file
echo "https://your-deployment.vercel.app" >> deployment-urls.txt

# Or use the script's auto-save feature
./deploy-multiple.sh  # Saves to deployment-urls.txt
```

### Testing Endpoints

```bash
# Health check
curl https://your-deployment.vercel.app/health

# Scan tokens
curl -X POST https://your-deployment.vercel.app/scan \
  -H "Content-Type: application/json" \
  -H "X-API-Key: YOUR_KEY" \
  -d '{"tokens":["0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"]}'
```

---

## Support

- **Vercel Docs:** https://vercel.com/docs
- **Vercel CLI Docs:** https://vercel.com/docs/cli
- **Project README:** [README.md](README.md)
- **Vercel Support:** https://vercel.com/support

---

## Summary

**For single deployment:**
```bash
vercel --prod --yes
```

**For mass deployment (50 instances):**
```bash
chmod +x deploy-multiple.sh
./deploy-multiple.sh
```

**Test deployment:**
```bash
curl https://your-deployment.vercel.app/health
```

That's it! Your API is now live and scalable on Vercel.
