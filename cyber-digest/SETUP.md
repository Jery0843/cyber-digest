# CyberDigest Deployment Guide

This project consists of two parts: the Astro website (Pages) and the backend automation (Worker).

## Prerequisites

- A Cloudflare account
- Node.js & npm installed
- Wrangler CLI installed globally (`npm install -g wrangler`)

## 1. Authentication

Login to Cloudflare via Wrangler:
```bash
wrangler login
```

## 2. Database Setup

1. Create the D1 database:
   ```bash
   wrangler d1 create cyber_daily
   ```
2. The output will give you a `database_id`. 
3. Open `cyber-digest/wrangler.toml` and `cyber-digest-worker/wrangler.toml` and replace `YOUR_D1_ID_HERE` with your new `database_id`.
4. Apply the schema and seed data to the production database:
   ```bash
   cd cyber-digest
   wrangler d1 execute cyber_daily --file=./schema.sql --remote
   wrangler d1 execute cyber_daily --file=./seed.sql --remote
   ```

## 3. Deploy the Website (Pages)

1. Ensure you're in the `cyber-digest` directory:
   ```bash
   cd cyber-digest
   ```
2. Deploy via Wrangler:
   ```bash
   npm run build
   wrangler pages deploy dist --project-name cyber-digest
   ```
3. In the Cloudflare Dashboard, go to your new Pages project `cyber-digest` -> Settings -> Bindings.
   - Add a D1 database binding. Name it `DB` and select `cyber_daily`.
   - Add a Workers AI binding. Name it `AI`.
4. Redeploy to apply the bindings.

## 4. Deploy the Automation (Worker)

1. Navigate to the worker directory:
   ```bash
   cd ../cyber-digest-worker
   ```
2. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```
3. The cron trigger is configured to run at `0 2 * * *` (2 AM UTC daily) automatically.

## 5. Optional Configuration

To increase rate limits for data fetching, you can add API keys via Cloudflare secrets:

```bash
wrangler secret put NVD_API_KEY
wrangler secret put GITHUB_TOKEN
```
