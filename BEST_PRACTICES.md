# Best Practices Guide

This document outlines best practices for operating, deploying, and maintaining the Railway deployment automation system. Follow these guidelines to ensure reliable, secure, and efficient operations.

---

## Table of Contents

1. [Deployment Best Practices](#deployment-best-practices)
2. [Environment Management](#environment-management)
3. [Database Operations](#database-operations)
4. [Monitoring & Observability](#monitoring--observability)
5. [Security Practices](#security-practices)
6. [Performance Optimization](#performance-optimization)
7. [Error Handling & Recovery](#error-handling--recovery)
8. [Testing Strategies](#testing-strategies)
9. [Documentation Maintenance](#documentation-maintenance)
10. [Team Workflows](#team-workflows)

---

## Deployment Best Practices

### Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All environment variables are set in Railway
- [ ] Database migrations have been tested in staging
- [ ] Health check endpoints are responding correctly
- [ ] Configuration files are up to date
- [ ] Secrets have been rotated if necessary
- [ ] Recent backups exist for rollback scenarios
- [ ] Team has been notified of deployment window

### Deployment Process

#### 1. Deploy to Staging First

Always test deployments in a staging environment before production:

```bash
# Deploy to staging
export RAILWAY_ENVIRONMENT=staging
npm run deploy

# Verify staging deployment
curl https://staging-api.railway.app/healthz

# Run smoke tests
npm run test:integration

# Manual verification
# - Check logs for errors
# - Test critical user flows
# - Verify integrations (R2, database, etc.)
```

#### 2. Production Deployment

```bash
# Deploy to production during low-traffic periods
export RAILWAY_ENVIRONMENT=production
npm run deploy

# Monitor deployment
npx @railway/cli logs --service web --environment production --follow

# Verify health
curl https://api.railway.app/healthz

# Check autoscaling status
npx @railway/cli status --service web --environment production
```

#### 3. Post-Deployment Verification

After deployment, verify:

```bash
# Check all services are healthy
for url in $API_HEALTHCHECK_URL $WORKER_HEALTHCHECK_URL; do
  curl -f $url && echo "✅ $url healthy" || echo "❌ $url failed"
done

# Monitor error rates
npx @railway/cli logs --service web | grep -i error

# Check database connections
# (run your application-specific health checks)

# Verify autoscaling is active
npx @railway/cli status
```

### Gradual Rollout Strategy

For high-risk changes, use a gradual rollout:

1. **Deploy to 10% of traffic**: Use Railway's traffic splitting or feature flags
2. **Monitor for 30 minutes**: Watch error rates, response times, CPU/memory
3. **Deploy to 50% of traffic**: If metrics are stable
4. **Monitor for 1 hour**: Continue monitoring
5. **Deploy to 100% of traffic**: Complete rollout

### Rollback Plan

Always have a rollback plan ready:

```bash
# Identify last known good deployment
npx @railway/cli deployment list --service web --environment production

# Rollback to previous deployment
npx @railway/cli deployment redeploy --service web --deployment <deployment-id>

# Skip migrations during rollback
npm run deploy -- --skip-migrations

# Verify rollback success
curl https://api.railway.app/healthz
npx @railway/cli logs --service web
```

### Deployment Anti-Patterns

❌ **Avoid**:
- Deploying on Fridays or before holidays
- Deploying without testing in staging
- Skipping health checks in production
- Deploying multiple services simultaneously without coordination
- Making database schema changes without backward compatibility
- Deploying during high-traffic periods without notice

✅ **Instead**:
- Deploy early in the week (Tuesday-Thursday)
- Always test in staging first
- Use health checks to validate deployments
- Deploy services sequentially with verification between each
- Use backward-compatible migrations (add columns before reading them)
- Schedule deployments during low-traffic windows

---

## Environment Management

### Environment Strategy

Maintain separate environments for different stages:

| Environment | Purpose | Branch | Auto-Deploy |
| --- | --- | --- | --- |
| **Development** | Active development, feature testing | `develop` | ✅ Yes |
| **Staging** | Pre-production testing, QA validation | `main` | ✅ Yes |
| **Production** | Live user traffic | `main` (manual) | ❌ No |

### Environment Variable Management

#### Naming Conventions

Use consistent naming for environment variables:

```env
# Format: <SERVICE>_<COMPONENT>_<PURPOSE>
DATABASE_URL=...              # Database connection
REDIS_URL=...                 # Cache connection
API_HEALTHCHECK_URL=...       # Health check endpoint
R2_ACCESS_KEY_ID=...          # External service credential
SMTP_HOST=...                 # Email service
```

#### Environment-Specific Variables

Create separate variable sets for each environment:

**Development**:
```env
NODE_ENV=development
DATABASE_URL=postgresql://localhost:5432/myapp_dev
API_URL=http://localhost:3000
LOG_LEVEL=debug
RATE_LIMIT_ENABLED=false
```

**Staging**:
```env
NODE_ENV=staging
DATABASE_URL=postgresql://staging-db.railway.app:5432/myapp
API_URL=https://staging-api.railway.app
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true
```

**Production**:
```env
NODE_ENV=production
DATABASE_URL=postgresql://prod-db.railway.app:5432/myapp
API_URL=https://api.example.com
LOG_LEVEL=warn
RATE_LIMIT_ENABLED=true
```

#### Secrets Rotation

Rotate secrets regularly:

```bash
# Generate new credentials
# 1. Create new secret in external service
# 2. Add new secret to Railway with temporary name
npx @railway/cli variables set DATABASE_URL_NEW=postgresql://new-connection

# 3. Test application with new credential
# 4. Switch to new credential
npx @railway/cli variables set DATABASE_URL=postgresql://new-connection

# 5. Remove old credential from external service
npx @railway/cli variables delete DATABASE_URL_NEW

# 6. Update documentation and team
```

**Rotation Schedule**:
- Database credentials: Every 90 days
- API tokens: Every 60 days
- Service account keys: Every 90 days
- TLS certificates: Automatic renewal (Railway handles this)

---

## Database Operations

### Migration Best Practices

#### 1. Backward-Compatible Migrations

Always make migrations backward compatible to support zero-downtime deployments:

**❌ Bad** (breaking change):
```sql
-- Removing column immediately breaks old code
ALTER TABLE users DROP COLUMN old_field;
```

**✅ Good** (multi-step process):
```sql
-- Step 1: Add new column (deploy code reading both columns)
ALTER TABLE users ADD COLUMN new_field VARCHAR(255);

-- Step 2: Migrate data from old to new column
UPDATE users SET new_field = old_field WHERE new_field IS NULL;

-- Step 3: Deploy code using only new column

-- Step 4: Drop old column (after verifying new column works)
ALTER TABLE users DROP COLUMN old_field;
```

#### 2. Test Migrations Locally

```bash
# Backup database before testing
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Test migration on local database
DATABASE_URL=postgresql://localhost:5432/test npm run migrate

# Verify migration result
psql postgresql://localhost:5432/test -c "SELECT * FROM schema_migrations"

# Test rollback (if your tool supports it)
# e.g., prisma migrate resolve --rolled-back <migration-name>
```

#### 3. Migration Checklist

Before running migrations in production:

- [ ] Tested locally with production-like data volume
- [ ] Reviewed SQL for performance impact (EXPLAIN ANALYZE)
- [ ] Identified indexes needed for new queries
- [ ] Estimated migration duration
- [ ] Prepared rollback script
- [ ] Notified team of potential downtime
- [ ] Created database backup

#### 4. Long-Running Migrations

For migrations that take >1 minute:

```bash
# Run migration in separate command, not during deployment
npx @railway/cli run --service web --environment production npm run migrate

# Monitor progress
npx @railway/cli logs --service web --follow

# If migration times out, consider:
# - Running migration outside deployment window
# - Breaking into smaller migrations
# - Creating indexes CONCURRENTLY (Postgres)
```

### Database Connection Management

#### Connection Pooling

Configure connection pooling based on service replicas:

```javascript
// Example for Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool size = (number of replicas × 10)
  // If max replicas = 3, use pool size of 30
  log: ['warn', 'error'],
});
```

**Formula**: `Max Pool Size = (Max Replicas × 10) + 10`

Example:
- Web service: 3 replicas × 10 = 30 connections
- Worker service: 5 replicas × 10 = 50 connections
- Total: 80 connections + 10 buffer = 90 max connections

#### Connection Best Practices

✅ **Do**:
- Use connection pooling in all services
- Set connection timeouts (30s recommended)
- Close connections gracefully on shutdown
- Monitor active connections via database metrics
- Use read replicas for read-heavy workloads

❌ **Don't**:
- Create new connections per request
- Leave connections open indefinitely
- Exceed database connection limits
- Use root/admin credentials in application
- Store database credentials in code

### Database Backup Strategy

```bash
# Automated backups (Railway Postgres includes this)
# Manual backup before risky operations:
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz

# Upload to R2 for long-term storage
# (integrate with your R2 upload script)

# Test restore periodically
gunzip -c backup-20241107.sql.gz | psql $DATABASE_URL_STAGING
```

**Backup Schedule**:
- Automated daily backups (Railway handles this)
- Manual backup before each production deployment
- Weekly backup verification (test restore to staging)
- Monthly backup audit (verify backup integrity)

---

## Monitoring & Observability

### Health Check Configuration

#### Comprehensive Health Checks

Expand the basic `/healthz` endpoint to include dependency checks:

```javascript
app.get('/healthz', async (req, res) => {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {}
  };

  // Database check
  try {
    await db.raw('SELECT 1');
    checks.checks.database = 'ok';
  } catch (error) {
    checks.checks.database = 'error';
    checks.status = 'degraded';
  }

  // R2 storage check (optional)
  try {
    await s3.send(new HeadBucketCommand({ Bucket: process.env.R2_BUCKET_NAME }));
    checks.checks.storage = 'ok';
  } catch (error) {
    checks.checks.storage = 'error';
    checks.status = 'degraded';
  }

  // Return 200 for "ok" or "degraded", 503 for "error"
  const statusCode = checks.status === 'error' ? 503 : 200;
  res.status(statusCode).json(checks);
});
```

#### Separate Liveness and Readiness

Implement separate endpoints for different health check types:

- **Liveness** (`/healthz`): Is the process alive? (restart if not)
- **Readiness** (`/ready`): Is the service ready to handle traffic? (route away if not)

```javascript
// Liveness: Basic process health
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Readiness: Dependency health
app.get('/ready', async (req, res) => {
  const ready = await checkDatabaseConnection() && await checkR2Access();
  res.status(ready ? 200 : 503).json({ ready });
});
```

### Logging Best Practices

#### Structured Logging

Use structured logs for easier parsing and analysis:

```javascript
// ❌ Bad: Unstructured logs
console.log('User login failed for user@example.com');

// ✅ Good: Structured logs
logger.info({
  event: 'user_login_failed',
  email: 'user@example.com',
  reason: 'invalid_password',
  ip: req.ip,
  timestamp: new Date().toISOString(),
});
```

#### Log Levels

Use appropriate log levels:

| Level | Purpose | Production? |
| --- | --- | --- |
| `debug` | Detailed debugging info | ❌ No |
| `info` | Normal operations, significant events | ✅ Yes |
| `warn` | Warnings, degraded performance | ✅ Yes |
| `error` | Errors requiring attention | ✅ Yes |
| `fatal` | Critical errors causing shutdown | ✅ Yes |

**Production configuration**:
```env
LOG_LEVEL=warn
```

#### Log Aggregation

Stream Railway logs to external monitoring:

```bash
# Stream logs to file for processing
npx @railway/cli logs --service web --environment production > app.log

# Or integrate with log aggregation service
# - Datadog: Use Datadog agent
# - Logtail: Use HTTP drain
# - Splunk: Use HTTP Event Collector
```

### Metrics Collection

Track key application metrics:

```javascript
// Request metrics
const metrics = {
  requests_total: 0,
  requests_failed: 0,
  response_time_sum: 0,
  response_time_count: 0,
};

app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    metrics.requests_total++;
    if (res.statusCode >= 400) metrics.requests_failed++;
    
    const duration = Date.now() - start;
    metrics.response_time_sum += duration;
    metrics.response_time_count++;
  });
  
  next();
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  const avgResponseTime = metrics.response_time_sum / metrics.response_time_count;
  res.json({
    requests_total: metrics.requests_total,
    requests_failed: metrics.requests_failed,
    error_rate: metrics.requests_failed / metrics.requests_total,
    avg_response_time_ms: avgResponseTime,
  });
});
```

### Alerting Strategy

Set up alerts for critical conditions:

| Alert | Condition | Severity | Action |
| --- | --- | --- | --- |
| Service down | Health check fails for >2 min | 🔴 Critical | Page on-call engineer |
| High error rate | Error rate >5% for >5 min | 🟠 High | Notify team channel |
| Slow responses | P95 latency >2s for >5 min | 🟡 Medium | Investigate during business hours |
| High CPU | CPU >80% for >10 min | 🟡 Medium | Review autoscaling config |
| Database connections | Connections >80% of max | 🟠 High | Scale up or investigate leaks |

---

## Security Practices

### Secrets Management

#### Never Commit Secrets

Use tools to prevent accidental commits:

```bash
# Install git-secrets
brew install git-secrets  # macOS
# or
apt-get install git-secrets  # Ubuntu

# Set up hooks
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'RAILWAY_TOKEN=.*'
git secrets --add 'DATABASE_URL=.*'
```

#### Use Environment Variables

```javascript
// ❌ Bad: Hardcoded credentials
const apiKey = 'sk_live_abc123xyz789';

// ✅ Good: Environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY environment variable is required');
}
```

#### Least Privilege Access

Grant minimum necessary permissions:

- **Railway**: Separate projects for dev/staging/prod with role-based access
- **Database**: Use application-specific user, not admin
- **R2**: Create bucket-specific API tokens, not account-wide

### Input Validation

Validate all user input:

```javascript
// ❌ Bad: No validation
const userId = req.params.id;
db.query(`SELECT * FROM users WHERE id = ${userId}`);

// ✅ Good: Validated and parameterized
const userId = parseInt(req.params.id, 10);
if (!userId || userId < 1) {
  return res.status(400).json({ error: 'Invalid user ID' });
}
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### Security Headers

Add security headers to HTTP responses:

```javascript
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

### Dependency Security

Regularly audit and update dependencies:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Update dependencies
npm update

# Check for outdated packages
npm outdated
```

**Schedule**:
- Weekly: Review `npm audit` results
- Monthly: Update dependencies
- Immediately: Apply critical security patches

---

## Performance Optimization

### Response Time Optimization

Target response times:
- **Health checks**: <100ms
- **API endpoints**: <200ms (P95)
- **Database queries**: <50ms (P95)

Optimization strategies:

```javascript
// 1. Add database indexes for common queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);

// 2. Use connection pooling (covered in Database Operations)

// 3. Implement caching
const cache = new Map();
app.get('/api/data', async (req, res) => {
  const cacheKey = `data:${req.params.id}`;
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  const data = await db.fetchData(req.params.id);
  cache.set(cacheKey, data);
  setTimeout(() => cache.delete(cacheKey), 60000); // 1 minute TTL
  
  res.json(data);
});

// 4. Use compression
const compression = require('compression');
app.use(compression());
```

### Autoscaling Configuration

Optimize autoscaling for your workload:

**CPU-bound workloads** (API servers):
```json
{
  "autoscale": {
    "minReplicas": 2,
    "maxReplicas": 5,
    "cpuTargetPercentage": 60
  }
}
```

**I/O-bound workloads** (background workers):
```json
{
  "autoscale": {
    "minReplicas": 1,
    "maxReplicas": 10,
    "cpuTargetPercentage": 40
  }
}
```

**Bursty workloads** (queue consumers):
```json
{
  "autoscale": {
    "minReplicas": 0,
    "maxReplicas": 20,
    "cpuTargetPercentage": 50
  }
}
```

### Resource Limits

Set appropriate resource limits to prevent over-provisioning:

| Service Type | vCPU | Memory | Disk |
| --- | --- | --- | --- |
| Small API | 0.5 | 512 MB | 1 GB |
| Medium API | 1.0 | 1 GB | 2 GB |
| Large API | 2.0 | 2 GB | 4 GB |
| Background Worker | 1.0 | 1 GB | 2 GB |

Monitor resource usage and adjust as needed.

---

## Error Handling & Recovery

### Graceful Shutdown

Handle shutdown signals properly:

```javascript
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`Received ${signal}, shutting down gracefully...`);

  // Stop accepting new requests
  server.close(() => {
    console.log('HTTP server closed');

    // Close database connections
    db.end(() => {
      console.log('Database connections closed');
      process.exit(0);
    });
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### Circuit Breaker Pattern

Prevent cascading failures:

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failures = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      setTimeout(() => {
        this.state = 'HALF_OPEN';
        this.failures = 0;
      }, this.timeout);
    }
  }
}
```

### Retry Logic

Implement exponential backoff for transient failures:

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Testing Strategies

### Testing Pyramid

Follow the testing pyramid for comprehensive coverage:

```
         /\
        /  \
       / E2E\      10% - End-to-end tests
      /______\
     /        \
    /Integration\ 30% - Integration tests
   /____________\
  /              \
 /  Unit Tests    \ 60% - Unit tests
/__________________\
```

### Unit Tests

Test individual functions in isolation:

```javascript
// src/utils/sanitize.test.js
const { sanitizeConnectionString } = require('./sanitize');

describe('sanitizeConnectionString', () => {
  it('should redact password from connection string', () => {
    const input = 'postgresql://user:secret@host:5432/db';
    const output = sanitizeConnectionString(input);
    expect(output).toBe('postgresql://user:***@host:5432/db');
  });
});
```

### Integration Tests

Test component interactions:

```javascript
// tests/integration/health.test.js
const request = require('supertest');
const app = require('../src/index');

describe('Health Check', () => {
  it('should return 200 OK', async () => {
    const response = await request(app).get('/healthz');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('uptime');
  });
});
```

### Smoke Tests

Validate critical paths after deployment:

```bash
#!/bin/bash
# tests/smoke/post-deploy.sh

API_URL=${API_HEALTHCHECK_URL}

# Test health endpoint
curl -f $API_URL/healthz || exit 1

# Test root endpoint
curl -f $API_URL/ || exit 1

# Test database connectivity (add your test)
# ...

echo "✅ All smoke tests passed"
```

Run after deployment:
```bash
npm run deploy && ./tests/smoke/post-deploy.sh
```

---

## Documentation Maintenance

### Keep Documentation Current

Update documentation when:
- Adding new features or endpoints
- Changing configuration options
- Updating deployment process
- Adding new environment variables
- Modifying architecture

### Documentation Review

Schedule quarterly reviews:
- [ ] Verify all commands still work
- [ ] Update version numbers
- [ ] Check external links
- [ ] Add new troubleshooting entries
- [ ] Remove outdated content

### Cross-Reference Documentation

Link related docs:
- API changes → Update API.md
- Architecture changes → Update ARCHITECTURE.md
- New setup steps → Update SETUP.md
- Deployment changes → Update DEPLOYMENT.md
- Best practices → Update BEST_PRACTICES.md

---

## Team Workflows

### Code Review Checklist

Before approving a pull request:

- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Environment variables are documented
- [ ] Security implications reviewed
- [ ] Performance impact considered
- [ ] Backward compatibility maintained
- [ ] Migration scripts included (if schema changes)

### Release Process

1. **Create release branch**: `git checkout -b release/v1.2.0`
2. **Update version**: `npm version minor`
3. **Update CHANGELOG**: Document changes
4. **Deploy to staging**: Test thoroughly
5. **Create pull request**: Get team approval
6. **Merge to main**: Trigger production deployment
7. **Create Git tag**: `git tag v1.2.0`
8. **Monitor production**: Watch for issues

### On-Call Procedures

When issues arise in production:

1. **Acknowledge**: Confirm you're investigating
2. **Assess**: Check logs, metrics, health checks
3. **Mitigate**: Rollback or apply hotfix
4. **Communicate**: Update team and stakeholders
5. **Resolve**: Fix root cause
6. **Post-mortem**: Document incident and learnings

---

## Related Documentation

- [API.md](./API.md) - API endpoint documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [SETUP.md](./SETUP.md) - Setup instructions
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines

---

## Conclusion

Following these best practices will help you:
- Deploy reliably with minimal downtime
- Maintain secure and performant systems
- Recover quickly from incidents
- Scale effectively with demand
- Keep the team aligned and productive

Review and update these practices regularly as your system evolves.
