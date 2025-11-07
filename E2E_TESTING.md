# End-to-End Testing Guide

This document provides comprehensive guidance for running and maintaining the Playwright E2E test suite for the Instagram Scraper application.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Setup](#local-setup)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Test Architecture](#test-architecture)
- [CI/CD Integration](#cicd-integration)
- [Debugging](#debugging)
- [Troubleshooting](#troubleshooting)

---

## Overview

The E2E test suite validates complete user workflows for the Instagram scraping platform using Playwright. Tests cover:

- ✅ Successful scrape requests
- ✅ Instagram challenge flows (SMS/2FA)
- ✅ Rate limiting handling
- ✅ Task monitoring and progress tracking
- ✅ Export file downloads
- ✅ Task cancellation
- ✅ Error states and validation
- ✅ UI/UX validation
- ✅ API integration
- ✅ S3/LocalStack storage

Total: **10 test suites** with **60+ individual test scenarios**

---

## Prerequisites

Before running E2E tests, ensure you have:

1. **Docker & Docker Compose** installed and running
2. **Node.js** v18 or newer
3. **npm** (comes with Node.js)
4. At least **4GB free RAM** for Docker containers
5. Ports available: `3000`, `5432`, `6379`, `4566`

---

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install Playwright Browsers

```bash
npm run setup:e2e
```

This installs Chromium and required system dependencies.

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

The default values work for local development with Docker Compose.

### 4. Start Docker Services

```bash
npm run docker:up
```

This starts:
- PostgreSQL database
- Redis for queue management
- LocalStack for S3 mocking
- API server
- Worker service

Wait for all services to be healthy (check with `docker-compose ps`).

### 5. Verify Setup

Check that services are running:

```bash
curl http://localhost:3000/healthz
```

Expected response:
```json
{
  "status": "ok",
  "uptimeSeconds": 1.234,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Running Tests

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

This opens Playwright's interactive test runner with:
- Test execution viewer
- Time travel debugging
- Screenshot/video playback
- Network request inspection

### Run Tests in Headed Mode

```bash
npm run test:e2e:headed
```

Opens a browser window to watch tests execute.

### Run Specific Test File

```bash
npx playwright test tests/e2e/01-successful-scrape.spec.js
```

### Run Tests by Pattern

```bash
npx playwright test --grep "challenge"
```

### Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

---

## Test Coverage

### 01. Successful Scrape Workflow
- ✅ Complete scrape via UI
- ✅ API scrape task creation
- ✅ Progress bar tracking
- ✅ Task completion verification

### 02. Challenge Flow
- ✅ Challenge requirement detection
- ✅ Modal display and interaction
- ✅ Code submission
- ✅ Challenge resolution via API
- ✅ Modal cancellation

### 03. Rate Limiting
- ✅ Rate limit status display
- ✅ Rate limit details via API
- ✅ Reset time validation
- ✅ Status badge styling

### 04. Task Monitoring
- ✅ Task list display
- ✅ Auto-refresh functionality
- ✅ Task detail viewing
- ✅ Status filtering
- ✅ Timestamp display

### 05. Export Download
- ✅ Download from UI
- ✅ Download via API
- ✅ JSON format validation
- ✅ Button visibility rules
- ✅ Error handling

### 06. Task Cancellation
- ✅ Cancel from UI with confirmation
- ✅ Cancel via API
- ✅ Cancellation restrictions
- ✅ Dialog rejection
- ✅ Button visibility

### 07. Error States
- ✅ Scraping errors
- ✅ Error message display
- ✅ Input validation
- ✅ API error responses
- ✅ Network error handling
- ✅ 404 handling
- ✅ Error badge styling

### 08. UI Validation
- ✅ Page title and header
- ✅ Button state management
- ✅ Input clearing
- ✅ Empty states
- ✅ Responsive design
- ✅ Action button visibility

### 09. API Integration
- ✅ Health check endpoint
- ✅ Concurrent requests
- ✅ Pagination
- ✅ CORS headers
- ✅ Content-Type validation
- ✅ Schema validation
- ✅ Malformed JSON handling

### 10. S3 Storage
- ✅ Export storage in LocalStack
- ✅ File format validation
- ✅ Upload error handling
- ✅ Unique key generation
- ✅ Content-Type headers
- ✅ Download functionality

---

## Test Architecture

### Directory Structure

```
tests/
└── e2e/
    ├── fixtures/
    │   └── test-fixture.js         # Shared test helpers
    ├── 01-successful-scrape.spec.js
    ├── 02-challenge-flow.spec.js
    ├── 03-rate-limiting.spec.js
    ├── 04-task-monitoring.spec.js
    ├── 05-export-download.spec.js
    ├── 06-cancellation.spec.js
    ├── 07-error-states.spec.js
    ├── 08-ui-validation.spec.js
    ├── 09-api-integration.spec.js
    └── 10-s3-storage.spec.js
```

### Test Fixtures

The `test-fixture.js` provides helper functions:

```javascript
apiHelper.createScrapeTask(username)         // Create task
apiHelper.getTask(taskId)                    // Get task details
apiHelper.waitForTaskStatus(taskId, status)  // Poll for status
apiHelper.cancelTask(taskId)                 // Cancel task
apiHelper.resolveChallenge(taskId, code)     // Resolve challenge
apiHelper.downloadExport(taskId)             // Download export
```

### Mocked Instagram Behavior

Tests use mocked Instagram responses based on username patterns:

- `*challenge*` → Triggers challenge flow
- `*ratelimit*` → Triggers rate limiting
- `*error*` → Triggers error state
- Any other → Successful scrape

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npm run setup:e2e
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for services
        run: |
          timeout 60 bash -c 'until curl -f http://localhost:3000/healthz; do sleep 2; done'
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: test-results/
          retention-days: 30
      
      - name: Cleanup
        if: always()
        run: docker-compose down -v
```

### GitLab CI Example

```yaml
e2e-tests:
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  services:
    - docker:dind
  variables:
    DOCKER_HOST: tcp://docker:2375
  script:
    - npm ci
    - docker-compose up -d
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - test-results/
    expire_in: 30 days
  only:
    - merge_requests
    - main
```

### Environment Variables for CI

```bash
CI=true                                    # Enable CI mode
BASE_URL=http://localhost:3000             # Override base URL
DATABASE_URL=postgresql://...              # Override DB
REDIS_URL=redis://...                      # Override Redis
AWS_S3_ENDPOINT=http://localstack:4566     # Override S3
```

---

## Debugging

### View Test Reports

After running tests:

```bash
npx playwright show-report test-results/html-report
```

Opens an HTML report with:
- Test results
- Screenshots
- Videos
- Network logs
- Console logs

### Inspect Failed Tests

Failed tests automatically save:
- **Screenshots** (`test-results/artifacts/`)
- **Videos** (`test-results/artifacts/`)
- **Traces** (`test-results/artifacts/`)

View traces:

```bash
npx playwright show-trace test-results/artifacts/trace.zip
```

### Debug Specific Test

```bash
npx playwright test tests/e2e/02-challenge-flow.spec.js --debug
```

### Console Logging

Add logging in tests:

```javascript
test('my test', async ({ page }) => {
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  // test code...
});
```

### Pause Execution

Insert breakpoints:

```javascript
await page.pause();
```

---

## Troubleshooting

### Services Not Starting

**Problem:** Docker containers fail to start

**Solution:**
```bash
docker-compose down -v
docker-compose up -d --force-recreate
docker-compose logs -f
```

### Port Conflicts

**Problem:** Port already in use

**Solution:**
```bash
# Check what's using the port
lsof -i :3000

# Kill the process or change port in docker-compose.yml
```

### Database Connection Errors

**Problem:** `ECONNREFUSED` to PostgreSQL

**Solution:**
```bash
# Ensure PostgreSQL is healthy
docker-compose ps postgres

# Restart if needed
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### LocalStack S3 Issues

**Problem:** S3 operations failing

**Solution:**
```bash
# Verify LocalStack is running
curl http://localhost:4566/_localstack/health

# Restart LocalStack
docker-compose restart localstack

# Check bucket exists
docker-compose exec api sh -c "npm install -g aws-cli"
docker-compose exec api aws --endpoint-url=http://localstack:4566 s3 ls
```

### Tests Timing Out

**Problem:** Tests hang or timeout

**Solution:**
1. Increase timeout in `playwright.config.js`:
   ```javascript
   use: {
     actionTimeout: 30000,  // Increase from 10s
   }
   ```

2. Check service health:
   ```bash
   curl http://localhost:3000/healthz
   ```

3. Review worker logs:
   ```bash
   docker-compose logs worker
   ```

### Flaky Tests

**Problem:** Tests pass/fail inconsistently

**Solution:**
1. Add explicit waits:
   ```javascript
   await page.waitForTimeout(1000);
   await page.waitForSelector('.task-item');
   ```

2. Use `waitForTaskStatus` helper instead of fixed delays

3. Enable retries in CI:
   ```javascript
   retries: process.env.CI ? 2 : 0
   ```

### Clean Slate Reset

Start fresh:

```bash
# Stop all services
docker-compose down -v

# Remove all containers, volumes, and images
docker system prune -af --volumes

# Rebuild and restart
docker-compose up -d --build

# Wait for health checks
npm run test:e2e
```

---

## Test Maintenance

### Adding New Tests

1. Create new spec file: `tests/e2e/11-my-feature.spec.js`
2. Import fixtures: `const { test, expect } = require('./fixtures/test-fixture');`
3. Write test cases
4. Update this documentation

### Updating Fixtures

Edit `tests/e2e/fixtures/test-fixture.js` to add new helpers.

### Extending Mock Behavior

Edit `src/worker/instagram-mock.js` to add new mock scenarios.

---

## Performance

Typical test execution times:

- Full suite: **8-12 minutes**
- Single test file: **30-60 seconds**
- UI mode: **Interactive**

Optimize by:
- Running tests in parallel (workers)
- Using `fullyParallel: true`
- Mocking external services
- Caching Docker images

---

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review test logs: `test-results/`
3. Check Docker logs: `npm run docker:logs`
4. Open an issue with:
   - Test output
   - Screenshots/videos
   - Environment details
   - Steps to reproduce

---

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [LocalStack S3 Docs](https://docs.localstack.cloud/user-guide/aws/s3/)
- [Project README](./README.md)

---

**Last Updated:** 2024-01-01  
**Version:** 1.0.0
