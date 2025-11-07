# Architecture Documentation

This document provides a comprehensive overview of the Railway deployment automation system architecture, including components, data flow, deployment pipeline, and design decisions.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Core Components](#core-components)
4. [Data Flow](#data-flow)
5. [Deployment Pipeline](#deployment-pipeline)
6. [Service Architecture](#service-architecture)
7. [Infrastructure Design](#infrastructure-design)
8. [Configuration Management](#configuration-management)
9. [Health Check System](#health-check-system)
10. [Scaling Strategy](#scaling-strategy)
11. [Storage & Persistence](#storage--persistence)
12. [Security Architecture](#security-architecture)
13. [Design Decisions](#design-decisions)

---

## System Overview

This project is a **deployment automation framework** for Railway-based applications. It orchestrates multi-service deployments, manages environment configuration, executes database migrations, and validates service health after deployment.

### Key Capabilities

- **Automated Deployment**: CLI-driven deployment of multiple services to Railway
- **Health Validation**: Post-deployment health checks with configurable retry logic
- **Migration Management**: Automated database migration execution during deployment
- **Environment Configuration**: Multi-environment support with secure credential management
- **Autoscaling Control**: Declarative autoscaling configuration for Railway services
- **Rollback Support**: Quick rollback to previous deployment versions

### Technology Stack

| Layer | Technology |
| --- | --- |
| **Runtime** | Node.js 18+ |
| **HTTP Server** | Node.js built-in `http` module |
| **Deployment Platform** | Railway (PaaS) |
| **Container Runtime** | Docker (Node 18 Alpine) |
| **Object Storage** | Cloudflare R2 (S3-compatible) |
| **Database** | Generic (Postgres/MySQL via `DATABASE_URL`) |
| **CLI Tools** | Railway CLI (`@railway/cli`) |

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      Developer Workstation                      │
│  ┌────────────────┐         ┌─────────────────────────────┐   │
│  │ npm run deploy │────────>│   scripts/deploy.js         │   │
│  └────────────────┘         │   - Load config             │   │
│                             │   - Validate env            │   │
│                             │   - Deploy services         │   │
│                             │   - Run migrations          │   │
│                             │   - Check health            │   │
│                             └─────────────┬───────────────┘   │
└───────────────────────────────────────────┼───────────────────┘
                                            │
                                            │ Railway CLI
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Railway Platform                         │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Project Environment                    │  │
│  │                                                            │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │   Web       │  │   Worker    │  │   Queue     │     │  │
│  │  │  Service    │  │   Service   │  │   Service   │     │  │
│  │  │             │  │             │  │             │     │  │
│  │  │ src/index.js│  │ (optional)  │  │ (optional)  │     │  │
│  │  │             │  │             │  │             │     │  │
│  │  │ GET /healthz│  │ GET /healthz│  │ GET /healthz│     │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │  │
│  │         │                │                │             │  │
│  │         └────────────────┴────────────────┘             │  │
│  │                          │                              │  │
│  │                   ┌──────▼──────┐                       │  │
│  │                   │  Database   │                       │  │
│  │                   │  (Postgres/ │                       │  │
│  │                   │   MySQL)    │                       │  │
│  │                   └─────────────┘                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                            │
                                            │ S3-compatible API
                                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare R2 Storage                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Bucket: Application Assets, Backups, Exports            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. HTTP Service (`src/index.js`)

**Purpose**: Minimal Node.js HTTP server for health checks and service availability verification.

**Responsibilities**:
- Listen on configurable `PORT` (default: 3000)
- Expose `/healthz` endpoint for health monitoring
- Provide service metadata at root path
- Return uptime and timestamp information

**Design Pattern**: Single-responsibility server focused on availability monitoring rather than application logic.

**Extension Point**: Replace with Express, Fastify, or other frameworks when implementing real application endpoints.

### 2. Deployment Orchestrator (`scripts/deploy.js`)

**Purpose**: Automates the end-to-end deployment workflow for Railway services.

**Responsibilities**:
1. Load environment variables from multiple sources (`.env.deploy`, `.env.production`, `.env`)
2. Parse command-line arguments (`--dry-run`, `--skip-migrations`, `--skip-health-checks`)
3. Deploy each service flagged with `"deploy": true` using Railway CLI
4. Execute database migrations via Railway's remote execution
5. Poll health check endpoints with exponential backoff
6. Report deployment status and autoscaling recommendations

**Key Functions**:
- `readJson()`: Parse configuration files
- `parseArgs()`: Command-line argument parser
- `applyEnvFromFile()`: Environment variable loader
- `runCommand()`: Spawn Railway CLI processes
- `ensureHealthy()`: Health check polling with timeout
- `describeAutoscale()`: Print autoscaling recommendations

**Error Handling**: Exits with non-zero status on any failure to support CI/CD integration.

### 3. Migration Runner (`scripts/migrate.js`)

**Purpose**: Database migration execution wrapper (currently a placeholder).

**Responsibilities**:
- Validate `DATABASE_URL` environment variable
- Invoke migration tool (Prisma, Sequelize, TypeORM, etc.)
- Sanitize connection strings for logging
- Report migration success/failure

**Implementation Status**: Placeholder that logs connection info without executing migrations. Customize with your migration tool of choice.

### 4. Configuration File (`config/deployment.config.json`)

**Purpose**: Declarative configuration for deployment behavior, services, and health checks.

**Structure**:
```json
{
  "environment": "production",
  "envFiles": [".env.deploy", ".env.production", ".env"],
  "services": [
    {
      "name": "web",
      "deploy": true,
      "migrateCommand": ["npm", "run", "migrate"],
      "healthCheck": { ... },
      "autoscale": { ... }
    }
  ],
  "rollback": { "service": "web" }
}
```

**Service Configuration Fields**:
- `name`: Railway service identifier
- `deploy`: Boolean flag to enable/disable deployment
- `migrateCommand`: Command array to execute migrations
- `healthCheck`: Health validation configuration
- `autoscale`: Resource scaling targets

### 5. Docker Container (`Dockerfile`)

**Purpose**: Containerized runtime environment for Railway deployment.

**Base Image**: `node:18-alpine` (minimal footprint)

**Build Steps**:
1. Copy `package*.json` and install production dependencies
2. Copy application source code
3. Set `NODE_ENV=production`
4. Expose port 3000
5. Define startup command: `node src/index.js`

**Optimization**: Uses multi-stage pattern with `--omit=dev` to exclude development dependencies.

---

## Data Flow

### Deployment Flow

```
1. Developer triggers deployment
   └─> npm run deploy

2. Load configuration and environment
   ├─> Read config/deployment.config.json
   ├─> Load .env.deploy (if exists)
   ├─> Load .env.production (if exists)
   └─> Load .env (fallback)

3. Validate prerequisites
   ├─> Check RAILWAY_TOKEN exists
   ├─> Check RAILWAY_PROJECT_ID exists
   └─> Determine target environment

4. Deploy services (sequential)
   For each service in config.services:
     ├─> Skip if deploy=false
     ├─> Execute: npx @railway/cli up --service <name> --environment <env>
     ├─> Wait for Railway build/deploy
     └─> Print autoscaling recommendations

5. Run migrations (if not skipped)
   For each service with migrateCommand:
     ├─> Execute: npx @railway/cli run --service <name> <command>
     └─> Wait for migration completion

6. Health checks (if not skipped)
   For each service with healthCheck:
     ├─> Poll health endpoint every 5s (configurable)
     ├─> Verify response status = 200
     ├─> Timeout after 180s (configurable)
     └─> Fail deployment if health check fails

7. Deployment complete
   └─> Exit 0 (success) or Exit 1 (failure)
```

### Health Check Flow

```
1. Extract health configuration
   ├─> URL from direct config or environment variable
   ├─> Expected status code (default: 200)
   ├─> Timeout duration (default: 180s)
   ├─> Polling interval (default: 5s)
   └─> Request timeout (default: 5s)

2. Poll endpoint with retry logic
   Loop until healthy or timeout:
     ├─> Send HTTP GET request
     ├─> Check response status code
     ├─> If matches expected: SUCCESS
     ├─> If error/mismatch: Log warning + wait interval
     └─> Check if deadline exceeded: FAIL

3. Report result
   ├─> Success: Log service name + URL
   └─> Failure: Throw error with timeout message
```

### Request Flow (Runtime)

```
1. Client sends HTTP request
   └─> https://your-service.railway.app/healthz

2. Railway ingress routes request
   └─> Load balancer → Service container

3. Node.js HTTP server receives request
   ├─> Parse URL pathname
   ├─> Match against registered routes
   └─> Execute handler

4. Handler generates response
   ├─> /healthz: Return status + uptime + timestamp
   └─> / (default): Return service info

5. Send response to client
   └─> JSON with Content-Type: application/json
```

---

## Deployment Pipeline

### Local Development Workflow

```bash
# 1. Clone repository
git clone <repository-url>
cd railway-deploy-automation

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 4. Start development server
npm start

# 5. Test locally
curl http://localhost:3000/healthz
```

### Production Deployment Workflow

```bash
# 1. Authenticate with Railway
npx @railway/cli login

# 2. Link to project (optional)
npx @railway/cli link

# 3. Configure environment variables in Railway Dashboard
# - RAILWAY_TOKEN, DATABASE_URL, R2_*, etc.

# 4. Deploy to production
npm run deploy

# 5. Monitor deployment
npx @railway/cli logs --service web --environment production
```

### CI/CD Integration

```yaml
# Example GitHub Actions workflow
name: Deploy to Railway
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm install
      - run: npm run deploy
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
          RAILWAY_PROJECT_ID: ${{ secrets.RAILWAY_PROJECT_ID }}
          RAILWAY_ENVIRONMENT: production
```

---

## Service Architecture

### Multi-Service Design

The architecture supports three service types:

#### 1. Web Service
- **Purpose**: HTTP API and frontend serving
- **Autoscaling**: 1-3 replicas, CPU target 65%
- **Health Check**: `/healthz` endpoint
- **Migrations**: Executes before service starts
- **Public**: Exposed via Railway's ingress

#### 2. Worker Service (Optional)
- **Purpose**: Background job processing
- **Autoscaling**: 0-5 replicas, CPU target 50%
- **Health Check**: Worker-specific health endpoint
- **Migrations**: None (uses web service database)
- **Private**: No public ingress

#### 3. Queue Service (Optional)
- **Purpose**: Message queue consumer
- **Autoscaling**: Manual or based on queue depth
- **Health Check**: Queue diagnostic endpoint
- **Migrations**: None
- **Private**: No public ingress

### Service Communication

```
Web Service
  ├─> Push jobs to message queue
  └─> Store data in shared database

Worker Service
  ├─> Pull jobs from message queue
  ├─> Process asynchronously
  ├─> Store results in shared database
  └─> Upload assets to R2 storage

Queue Service
  ├─> Consume messages from queue
  ├─> Route to appropriate handlers
  └─> Report metrics to monitoring
```

---

## Infrastructure Design

### Railway Platform Integration

**Deployment Method**: Docker-based via `Dockerfile`

**Build Process**:
1. Railway clones repository
2. Detects `Dockerfile` presence
3. Builds image with BuildKit
4. Pushes to internal registry
5. Deploys to container runtime

**Networking**:
- Railway assigns a public URL per service
- Internal services communicate via private network
- Environment variables inject service URLs

**Secrets Management**:
- Store credentials in Railway environment variables
- Never commit secrets to version control
- Use `.env.example` as template without values

### Cloudflare R2 Integration

**Purpose**: S3-compatible object storage for application assets.

**Configuration**:
```env
R2_ACCOUNT_ID=abc123
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=my-app-bucket
R2_PUBLIC_BUCKET_URL=https://cdn.example.com
```

**Usage Patterns**:
- File uploads from web service
- Asset downloads via public CDN URL
- Backup storage for database exports
- Temporary file storage for processing

**SDK Integration**: Use AWS SDK v3 with R2 endpoint configuration.

### Database Architecture

**Connection**: Generic `DATABASE_URL` environment variable.

**Supported Databases**:
- PostgreSQL (recommended for Railway)
- MySQL
- SQLite (development only)

**Migration Strategy**:
- Migrations run before web service starts
- Use preferred migration tool (Prisma, Sequelize, etc.)
- Customize `scripts/migrate.js` for your tool

**Connection Pooling**: Configure in application layer based on service replica count.

---

## Configuration Management

### Environment Variable Hierarchy

The deployment script loads environment variables in this order (later sources override earlier ones):

1. `.env` (base configuration)
2. `.env.production` (environment-specific)
3. `.env.deploy` (deployment secrets)
4. `process.env` (system/CI environment)

### Configuration Sources

| Source | Purpose | Committed? |
| --- | --- | --- |
| `.env.example` | Template with required variables | ✅ Yes |
| `.env` | Local development defaults | ❌ No |
| `.env.production` | Production environment config | ❌ No |
| `.env.deploy` | Deployment secrets | ❌ No |
| `config/deployment.config.json` | Service and deployment config | ✅ Yes |
| Railway Environment Variables | Production secrets | N/A (Railway only) |

### Service Configuration Schema

```typescript
interface DeploymentConfig {
  environment: string;
  envFiles: string[];
  services: ServiceConfig[];
  rollback?: {
    service: string;
  };
}

interface ServiceConfig {
  name: string;
  deploy: boolean;
  migrateCommand?: string | string[];
  healthCheck?: HealthCheckConfig;
  autoscale?: AutoscaleConfig;
}

interface HealthCheckConfig {
  name?: string;
  url?: string;
  urlEnv?: string;
  expectedStatus?: number;
  timeoutSeconds?: number;
  intervalSeconds?: number;
  requestTimeoutSeconds?: number;
}

interface AutoscaleConfig {
  minReplicas?: number;
  maxReplicas?: number;
  cpuTargetPercentage?: number;
  memoryMiB?: number;
}
```

---

## Health Check System

### Design Goals

1. **Fast Failure Detection**: Identify unhealthy deployments within minutes
2. **Retry Tolerance**: Handle temporary network issues or slow startups
3. **Configurable Timeouts**: Different services may need different startup times
4. **Non-Blocking**: Don't block deployments that don't require health checks

### Implementation Details

**Polling Logic**:
```javascript
async function ensureHealthy(serviceName, healthConfig) {
  const deadline = Date.now() + timeoutSeconds * 1000;
  
  while (Date.now() <= deadline) {
    try {
      const status = await requestStatus(endpoint, requestTimeoutMs);
      if (status === expectedStatus) {
        console.log(`✅ ${serviceName} healthy`);
        return;
      }
    } catch (error) {
      console.warn(`Retrying in ${intervalSeconds}s...`);
    }
    
    await delay(intervalSeconds * 1000);
  }
  
  throw new Error(`Health check timed out for ${serviceName}`);
}
```

**Timeout Calculation**:
- Default timeout: 180 seconds
- Polling interval: 5 seconds
- Request timeout: 5 seconds per request
- Maximum attempts: `timeoutSeconds / intervalSeconds` = 36 attempts

### Health Endpoint Requirements

Each service must expose a health endpoint that:
1. Responds with HTTP 200 when healthy
2. Returns JSON with service status
3. Includes uptime or timestamp for debugging
4. Responds within 5 seconds (configurable)
5. Does not perform expensive operations

---

## Scaling Strategy

### Horizontal Scaling

**Web Service**:
- Min replicas: 1 (always available)
- Max replicas: 3 (burst capacity)
- CPU target: 65% (scale up when exceeded)

**Worker Service**:
- Min replicas: 0 (scale to zero when idle)
- Max replicas: 5 (handle job bursts)
- CPU target: 50% (more aggressive scaling)

**Queue Service**:
- Manual scaling based on message queue depth
- Consider queue-based autoscaling metrics

### Vertical Scaling

Configure in Railway Dashboard:
- CPU: 0.5-2 vCPU per replica
- Memory: 512MB-2GB per replica
- Adjust based on application requirements

### Autoscaling Configuration

Apply via Railway CLI:
```bash
npx @railway/cli scale web --min 1 --max 3 --cpu 65
npx @railway/cli scale worker --min 0 --max 5 --cpu 50
```

Or update `config/deployment.config.json` and document for team reference.

---

## Storage & Persistence

### Stateless Service Design

- **No local file storage**: Use R2 for persistent files
- **Session storage**: Use Redis or database-backed sessions
- **Ephemeral disk**: Railway containers have temporary disk space only
- **Database state**: All persistent state in database

### Object Storage (R2)

**Use Cases**:
- User uploads (images, documents, etc.)
- Export files (CSV, JSON, Excel)
- Backup archives
- Static assets (if not using CDN)

**Access Pattern**:
```javascript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

await s3.send(new PutObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: 'path/to/file.txt',
  Body: buffer,
}));
```

### Database Design

**Connection Management**:
- Use connection pooling (max = total replicas × 10)
- Set connection timeout to 30s
- Enable connection retry logic
- Close connections gracefully on shutdown

**Migration Strategy**:
- Run migrations before web service starts
- Use locking to prevent concurrent migrations
- Test migrations in staging environment first
- Keep migration rollback scripts ready

---

## Security Architecture

### Secrets Management

**Environment Variables**:
- Store all secrets in Railway environment variables
- Never commit credentials to Git
- Use `.env.example` with placeholder values
- Rotate credentials regularly

**Access Control**:
- Limit Railway project access to necessary team members
- Use separate environments for staging/production
- Enable MFA on Railway account
- Review audit logs regularly

### Network Security

**HTTPS Enforcement**:
- Railway provides automatic HTTPS via Let's Encrypt
- Redirect HTTP to HTTPS in production
- Use HSTS headers for browser enforcement

**Private Services**:
- Worker and queue services should not be publicly exposed
- Use Railway's private network for inter-service communication
- Implement authentication for any public APIs

### Input Validation

- Validate all environment variables at startup
- Sanitize database connection strings in logs
- Validate URLs before making HTTP requests
- Use parameterized queries to prevent SQL injection

---

## Design Decisions

### Why Node.js Built-in HTTP Module?

**Decision**: Use native `http` module instead of Express/Fastify.

**Rationale**:
- Minimal dependencies for deployment automation tool
- Faster startup time
- Smaller Docker image
- Sufficient for health check endpoint
- Easy to replace with framework when needed

### Why Sequential Service Deployment?

**Decision**: Deploy services one at a time, not in parallel.

**Rationale**:
- Easier to debug deployment failures
- Prevents race conditions in migrations
- Allows per-service error handling
- More predictable deployment order

### Why Polling-Based Health Checks?

**Decision**: Poll health endpoints instead of webhook callbacks.

**Rationale**:
- Simpler implementation without webhook server
- Works with any HTTP endpoint
- Configurable retry logic
- Railway doesn't provide deployment webhooks

### Why Declarative Configuration?

**Decision**: Use JSON configuration file instead of imperative scripts.

**Rationale**:
- Version controlled deployment configuration
- Self-documenting service architecture
- Easy to validate and test
- Supports multiple environments

### Why Docker Instead of Buildpacks?

**Decision**: Use `Dockerfile` instead of Railway's auto-detected buildpacks.

**Rationale**:
- Explicit control over build process
- Reproducible builds across environments
- Optimized for production (Alpine, multi-stage)
- Industry standard approach

---

## Related Documentation

- [API.md](./API.md) - HTTP endpoint documentation
- [SETUP.md](./SETUP.md) - Local development and deployment setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Railway deployment guide
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Operational best practices
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

---

## Future Architecture Considerations

### Potential Enhancements

1. **Message Queue**: Add Redis or RabbitMQ for job processing
2. **Caching Layer**: Implement Redis for session/data caching
3. **API Gateway**: Add rate limiting, authentication middleware
4. **Observability**: Integrate Datadog, New Relic, or OpenTelemetry
5. **Feature Flags**: Implement LaunchDarkly or similar for feature rollout
6. **GraphQL Layer**: Add GraphQL API alongside REST endpoints

### Scaling Considerations

- **Database**: Consider read replicas for read-heavy workloads
- **CDN**: Use Cloudflare CDN for static asset delivery
- **Search**: Add Elasticsearch for full-text search requirements
- **Analytics**: Implement event streaming with Kafka or AWS Kinesis

---

For questions about the architecture or suggestions for improvements, see [CONTRIBUTING.md](./CONTRIBUTING.md).
