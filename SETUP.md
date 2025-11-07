# Setup Guide

This guide walks you through setting up the Railway deployment automation project for local development and production deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Environment Configuration](#environment-configuration)
4. [Railway Setup](#railway-setup)
5. [Database Setup](#database-setup)
6. [Cloudflare R2 Setup](#cloudflare-r2-setup)
7. [Running the Application](#running-the-application)
8. [Testing the Setup](#testing-the-setup)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

| Software | Version | Purpose | Installation |
| --- | --- | --- | --- |
| **Node.js** | 18.x or newer | Runtime environment | [nodejs.org](https://nodejs.org/) |
| **npm** | 9.x or newer | Package manager | Included with Node.js |
| **Git** | 2.x or newer | Version control | [git-scm.com](https://git-scm.com/) |
| **Docker** | 20.x or newer | Container testing (optional) | [docker.com](https://www.docker.com/) |

### Required Accounts

1. **Railway Account**: Sign up at [railway.app](https://railway.app/)
2. **Cloudflare Account** (if using R2 storage): Sign up at [cloudflare.com](https://www.cloudflare.com/)
3. **Git Provider**: GitHub, GitLab, or Bitbucket for version control

### Verify Prerequisites

```bash
# Check Node.js version
node --version
# Expected: v18.x.x or higher

# Check npm version
npm --version
# Expected: 9.x.x or higher

# Check Git version
git --version
# Expected: 2.x.x or higher

# Check Docker version (optional)
docker --version
# Expected: 20.x.x or higher
```

---

## Local Development Setup

### 1. Clone the Repository

```bash
# Clone via HTTPS
git clone https://github.com/your-org/railway-deploy-automation.git

# Or clone via SSH
git clone git@github.com:your-org/railway-deploy-automation.git

# Navigate to project directory
cd railway-deploy-automation
```

### 2. Install Dependencies

```bash
# Install all project dependencies
npm install

# Verify installation
npm list --depth=0
```

**Note**: This project has minimal dependencies by design. The main dependency is the Railway CLI, which is invoked via `npx` and doesn't need explicit installation.

### 3. Create Environment File

```bash
# Copy the example environment file
cp .env.example .env

# Open .env in your editor
nano .env
# or
code .env
```

### 4. Configure Local Environment

Edit `.env` with your local development values:

```env
# Railway authentication (optional for local dev)
RAILWAY_TOKEN=
RAILWAY_PROJECT_ID=
RAILWAY_ENVIRONMENT=development

# Database configuration (use local database for development)
DATABASE_URL=postgresql://user:password@localhost:5432/myapp_dev

# Health check endpoints (leave blank for local dev)
API_HEALTHCHECK_URL=
WORKER_HEALTHCHECK_URL=
QUEUE_HEALTHCHECK_URL=

# Cloudflare R2 object storage (optional for local dev)
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=
R2_PUBLIC_BUCKET_URL=
```

**For local development**, you can leave Railway and R2 credentials empty unless you're testing deployment or storage features.

---

## Environment Configuration

### Environment Variable Reference

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `RAILWAY_TOKEN` | For deployment | None | Railway API authentication token |
| `RAILWAY_PROJECT_ID` | For deployment | None | Railway project identifier |
| `RAILWAY_ENVIRONMENT` | For deployment | `production` | Target environment (dev/staging/production) |
| `DATABASE_URL` | For migrations | None | Database connection string |
| `API_HEALTHCHECK_URL` | For health checks | None | URL to web service `/healthz` endpoint |
| `WORKER_HEALTHCHECK_URL` | Optional | None | URL to worker service health endpoint |
| `QUEUE_HEALTHCHECK_URL` | Optional | None | URL to queue service health endpoint |
| `R2_ACCOUNT_ID` | For R2 storage | None | Cloudflare R2 account identifier |
| `R2_ACCESS_KEY_ID` | For R2 storage | None | R2 access key (public) |
| `R2_SECRET_ACCESS_KEY` | For R2 storage | None | R2 secret key (private) |
| `R2_BUCKET_NAME` | For R2 storage | None | R2 bucket name |
| `R2_PUBLIC_BUCKET_URL` | Optional | None | Public CDN URL for R2 assets |
| `PORT` | Runtime | `3000` | HTTP server listening port |
| `NODE_ENV` | Runtime | None | Environment mode (development/production) |

### Multi-Environment Configuration

For managing multiple environments, create separate environment files:

```bash
# Development environment
.env.development

# Staging environment
.env.staging

# Production environment (never commit this)
.env.production

# Deployment secrets (never commit this)
.env.deploy
```

The deployment script loads environment files in this order:
1. `.env` (base)
2. `.env.production` (environment-specific)
3. `.env.deploy` (deployment secrets)

### Security Best Practices

✅ **DO**:
- Use `.env.example` as a template
- Store secrets in Railway environment variables for production
- Use different credentials for each environment
- Rotate credentials regularly
- Keep `.env` files out of version control

❌ **DON'T**:
- Commit `.env` files to Git
- Share `.env` files via email or chat
- Use production credentials in development
- Hardcode credentials in source code

---

## Railway Setup

### 1. Create Railway Account

1. Visit [railway.app](https://railway.app/)
2. Sign up with GitHub, GitLab, or email
3. Verify your email address
4. Complete onboarding

### 2. Install Railway CLI

The project uses `npx` to invoke the Railway CLI on-demand, but you can also install it globally for convenience:

```bash
# Install globally (optional)
npm install -g @railway/cli

# Or use npx (no installation needed)
npx @railway/cli --version
```

### 3. Authenticate Railway CLI

```bash
# Login to Railway
npx @railway/cli login

# This opens a browser window for authentication
# After successful login, you'll see:
# ✅ Logged in as your-email@example.com
```

### 4. Create Railway Project

#### Option A: Via Dashboard

1. Log in to [railway.app/dashboard](https://railway.app/dashboard)
2. Click **New Project**
3. Select **Empty Project**
4. Name your project (e.g., "my-app")
5. Create environments (development, staging, production)

#### Option B: Via CLI

```bash
# Create a new project
npx @railway/cli init

# Follow the prompts:
# - Project name: my-app
# - Team: (select your team)
```

### 5. Link Local Repository to Railway

```bash
# Link to existing project
npx @railway/cli link

# Follow the prompts to select:
# - Team
# - Project
# - Environment

# Verify linkage
npx @railway/cli status
```

This creates a `.railway/` directory with project metadata (excluded from Git by `.gitignore`).

### 6. Retrieve Railway Credentials

```bash
# Get your Railway token (for deployment automation)
npx @railway/cli whoami

# Note the token displayed (or generate one from Dashboard → Account → Access Tokens)
```

### 7. Configure Railway Environment Variables

#### Via Dashboard

1. Go to your project in Railway Dashboard
2. Select the **web** service (or create it)
3. Click **Variables** tab
4. Add each environment variable from `.env.example`
5. Click **Deploy** to apply changes

#### Via CLI

```bash
# Set a single variable
npx @railway/cli variables set KEY=value

# Set multiple variables from file (be careful with secrets!)
npx @railway/cli variables set --from-file .env.production
```

### 8. Create Railway Services

For a multi-service setup, create these services in your Railway project:

| Service | Purpose | Deploy Enabled |
| --- | --- | --- |
| `web` | HTTP API server | ✅ Yes |
| `worker` | Background job processing | ⚠️ Optional |
| `queue` | Message queue consumer | ⚠️ Optional |

**Create via Dashboard**:
1. In your project, click **New Service**
2. Select **GitHub Repo** (or **Empty Service** for manual setup)
3. Name the service (e.g., "web")
4. Configure build and start commands
5. Set environment variables

**Configure in `config/deployment.config.json`**:
```json
{
  "services": [
    {
      "name": "web",
      "deploy": true
    },
    {
      "name": "worker",
      "deploy": false
    }
  ]
}
```

---

## Database Setup

### 1. Choose Database Provider

The project supports any database with a connection string. Options:

#### Railway Postgres (Recommended)

1. In Railway Dashboard, click **New** → **Database** → **PostgreSQL**
2. Railway automatically creates a database and sets `DATABASE_URL`
3. Note the connection details from the **Connect** tab

#### External Database

Alternatively, use:
- [Supabase](https://supabase.com/) (Postgres)
- [PlanetScale](https://planetscale.com/) (MySQL)
- [Neon](https://neon.tech/) (Serverless Postgres)
- Self-hosted database

### 2. Set Database URL

Add `DATABASE_URL` to your Railway environment variables:

```bash
# Format: postgresql://user:password@host:port/database
DATABASE_URL=postgresql://user:pass@your-db-host.railway.app:5432/railway
```

### 3. Configure Migration Tool

The project includes a migration placeholder in `scripts/migrate.js`. Customize it for your migration tool:

#### Prisma Example

```bash
# Install Prisma
npm install prisma @prisma/client --save-dev

# Initialize Prisma
npx prisma init

# Create migration
npx prisma migrate dev --name init
```

Update `scripts/migrate.js`:
```javascript
const { execSync } = require('node:child_process');

function main() {
  assertEnv('DATABASE_URL');
  console.log('Running Prisma migrations...');
  execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  console.log('Migrations completed successfully.');
}
```

#### Sequelize Example

```bash
# Install Sequelize
npm install sequelize sequelize-cli pg --save

# Initialize Sequelize
npx sequelize-cli init
```

Update `scripts/migrate.js`:
```javascript
const { execSync } = require('node:child_process');

function main() {
  assertEnv('DATABASE_URL');
  console.log('Running Sequelize migrations...');
  execSync('npx sequelize-cli db:migrate', { stdio: 'inherit' });
  console.log('Migrations completed successfully.');
}
```

### 4. Test Database Connection

```bash
# Run migration script locally
npm run migrate

# Expected output:
# Running database migrations using connection: postgresql://***@host/db
# [Your migration tool output]
# Migration step completed
```

---

## Cloudflare R2 Setup

If your application needs object storage for file uploads, backups, or assets, configure Cloudflare R2:

### 1. Create R2 Bucket

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Name your bucket (e.g., `my-app-production`)
5. Choose a location (optional)
6. Click **Create bucket**

### 2. Generate R2 API Tokens

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Configure permissions:
   - **Permissions**: Read & Write
   - **Bucket**: Select your bucket or "All buckets"
4. Click **Create API Token**
5. **Copy and save** the Access Key ID and Secret Access Key (shown once!)

### 3. Configure R2 Environment Variables

Add to your Railway environment variables:

```env
R2_ACCOUNT_ID=abc123def456  # From R2 dashboard URL
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=my-app-production
R2_PUBLIC_BUCKET_URL=https://pub-abc123.r2.dev  # Optional: public bucket URL
```

### 4. Install AWS SDK (for R2 access)

```bash
# Install AWS SDK v3
npm install @aws-sdk/client-s3 --save
```

### 5. Test R2 Connection

Create a test script `scripts/test-r2.js`:

```javascript
const { S3Client, ListBucketsCommand } = require('@aws-sdk/client-s3');

const client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function test() {
  const response = await client.send(new ListBucketsCommand({}));
  console.log('R2 connection successful!');
  console.log('Buckets:', response.Buckets.map(b => b.Name));
}

test().catch(console.error);
```

Run the test:
```bash
node scripts/test-r2.js
```

---

## Running the Application

### Local Development Mode

```bash
# Start the HTTP server
npm start

# Expected output:
# HTTP server listening on port 3000
```

The server will be available at `http://localhost:3000`.

### Test Endpoints

```bash
# Test health check endpoint
curl http://localhost:3000/healthz

# Expected response:
# {"status":"ok","uptimeSeconds":12.345,"timestamp":"2024-11-07T18:00:00.000Z"}

# Test root endpoint
curl http://localhost:3000/

# Expected response:
# {"message":"Railway deployment automation placeholder service","healthcheck":"/healthz"}
```

### Development with Auto-Reload

For development with automatic reloading on file changes:

```bash
# Install nodemon (dev dependency)
npm install --save-dev nodemon

# Add to package.json scripts:
# "dev": "nodemon src/index.js"

# Run in development mode
npm run dev
```

### Docker Development

Test the Docker build locally:

```bash
# Build Docker image
docker build -t railway-app .

# Run container
docker run -p 3000:3000 --env-file .env railway-app

# Test from host
curl http://localhost:3000/healthz
```

### Custom Port

```bash
# Run on different port
PORT=8080 npm start

# Test custom port
curl http://localhost:8080/healthz
```

---

## Testing the Setup

### 1. Verify Local Server

```bash
# Start server
npm start

# In another terminal, test health check
curl -v http://localhost:3000/healthz

# Verify response:
# - HTTP 200 OK
# - Content-Type: application/json
# - Response contains status, uptimeSeconds, timestamp
```

### 2. Verify Database Connection

```bash
# Run migration script
npm run migrate

# Should succeed or show connection error if DATABASE_URL is invalid
```

### 3. Verify Railway Connection

```bash
# Check Railway authentication
npx @railway/cli whoami

# Check project linkage
npx @railway/cli status

# List environment variables (redacted)
npx @railway/cli variables
```

### 4. Dry-Run Deployment

Test the deployment script without actually deploying:

```bash
# Set required environment variables
export RAILWAY_TOKEN=your-token-here
export RAILWAY_PROJECT_ID=your-project-id

# Run dry-run deployment
npm run deploy -- --dry-run

# Expected output:
# Running in dry-run mode. No changes will be applied.
# DRY RUN: npx --yes @railway/cli up --ci --service web --environment production
# [Additional dry-run output...]
# Deployment workflow completed successfully.
```

### 5. Test Deployment to Development Environment

```bash
# Deploy to development environment
export RAILWAY_ENVIRONMENT=development
npm run deploy

# This will:
# 1. Deploy the web service
# 2. Run migrations
# 3. Check health endpoints
# 4. Report success or failure
```

---

## Troubleshooting

### Common Issues and Solutions

#### Issue: `Missing required environment variable: RAILWAY_TOKEN`

**Solution**: Export the Railway token before deploying:
```bash
# Get your token
npx @railway/cli login
npx @railway/cli whoami

# Set in environment
export RAILWAY_TOKEN=your-token-here

# Or add to .env.deploy file
echo "RAILWAY_TOKEN=your-token-here" >> .env.deploy
```

#### Issue: `Missing configuration file: config/deployment.config.json`

**Solution**: Verify the config file exists and is valid JSON:
```bash
# Check file exists
ls -la config/deployment.config.json

# Validate JSON syntax
cat config/deployment.config.json | npx json-validate
```

#### Issue: `Health check timed out for API`

**Solution**: Verify the health check URL is correct and accessible:
```bash
# Check environment variable
echo $API_HEALTHCHECK_URL

# Test health endpoint manually
curl https://your-service.railway.app/healthz

# If service is not accessible, check Railway logs
npx @railway/cli logs --service web
```

#### Issue: `ECONNREFUSED connecting to database`

**Solution**: Verify database URL and connectivity:
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test database connection (PostgreSQL example)
psql $DATABASE_URL -c "SELECT 1"

# For Railway databases, ensure the database service is running
npx @railway/cli status
```

#### Issue: `Railway CLI command not found`

**Solution**: The CLI is invoked via `npx`, which requires internet connection:
```bash
# Verify npm/npx work
npx --version

# Manually install Railway CLI (optional)
npm install -g @railway/cli

# Test installation
railway --version
```

#### Issue: Port already in use (EADDRINUSE)

**Solution**: Change the port or kill the process using it:
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -ano | grep 3000

# Kill the process (replace PID)
kill -9 <PID>

# Or use a different port
PORT=3001 npm start
```

#### Issue: Docker build fails

**Solution**: Check Docker is running and Dockerfile is valid:
```bash
# Verify Docker is running
docker ps

# Check Dockerfile syntax
docker build --check -t railway-app .

# View build logs
docker build -t railway-app . --progress=plain
```

#### Issue: `Cannot find module 'xyz'`

**Solution**: Reinstall dependencies:
```bash
# Remove node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

### Getting Help

If you continue to experience issues:

1. **Check the logs**: `npx @railway/cli logs --service web`
2. **Review documentation**: See [ARCHITECTURE.md](./ARCHITECTURE.md) and [API.md](./API.md)
3. **Search existing issues**: Check the GitHub Issues page
4. **Report a bug**: See [CONTRIBUTING.md](./CONTRIBUTING.md) for reporting guidelines

---

## Next Steps

After completing the setup:

1. **Read the Architecture**: Review [ARCHITECTURE.md](./ARCHITECTURE.md) to understand system design
2. **Review API Docs**: See [API.md](./API.md) for endpoint documentation
3. **Deploy to Production**: Follow [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment
4. **Follow Best Practices**: Read [BEST_PRACTICES.md](./BEST_PRACTICES.md) for operational guidance
5. **Contribute**: See [CONTRIBUTING.md](./CONTRIBUTING.md) to contribute to the project

---

## Quick Reference

### Common Commands

```bash
# Development
npm start                    # Start HTTP server
npm run migrate             # Run database migrations

# Deployment
npm run deploy              # Deploy to Railway
npm run deploy -- --dry-run # Dry-run deployment
npm run deploy -- --skip-migrations # Deploy without migrations
npm run deploy -- --skip-health-checks # Deploy without health checks

# Railway CLI
npx @railway/cli login      # Authenticate
npx @railway/cli link       # Link to project
npx @railway/cli status     # Check deployment status
npx @railway/cli logs       # View service logs
npx @railway/cli variables  # List environment variables

# Docker
docker build -t railway-app .                # Build image
docker run -p 3000:3000 railway-app          # Run container
```

### Directory Structure

```
railway-deploy-automation/
├── config/
│   └── deployment.config.json   # Service configuration
├── scripts/
│   ├── deploy.js                # Deployment orchestration
│   └── migrate.js               # Database migrations
├── src/
│   └── index.js                 # HTTP server
├── .env.example                 # Environment template
├── Dockerfile                   # Container definition
├── package.json                 # Project metadata
└── README.md                    # Project overview (if exists)
```

---

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).
