# Quick Start Guide

Get up and running with E2E tests in 5 minutes.

## Prerequisites

- Docker & Docker Compose
- Node.js v18+
- npm

## Installation

```bash
# 1. Install dependencies
npm install

# 2. Install Playwright browsers
npm run setup:e2e

# 3. Start services
npm run docker:up

# 4. Wait for services to be ready (check health)
curl http://localhost:3000/healthz
```

## Run Tests

```bash
# Run all tests
npm run test:e2e

# Interactive UI mode (recommended for debugging)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run specific test
npx playwright test tests/e2e/01-successful-scrape.spec.js

# Debug mode
npm run test:e2e:debug
```

## Access Services

- **Web UI:** http://localhost:3000
- **API:** http://localhost:3000/api
- **Health Check:** http://localhost:3000/healthz
- **PostgreSQL:** localhost:5432 (user: postgres, pass: postgres)
- **Redis:** localhost:6379
- **LocalStack S3:** http://localhost:4566

## Test Data

Use these usernames to trigger different scenarios:

- `test_success_user` → Successful scrape
- `test_challenge_user` → Instagram challenge
- `test_ratelimit_user` → Rate limiting
- `test_error_user` → Error state
- Any other → Normal successful scrape

## View Results

```bash
# HTML report
npx playwright show-report test-results/html-report

# Trace viewer (time-travel debugging)
npx playwright show-trace test-results/artifacts/trace.zip
```

## Cleanup

```bash
# Stop services
npm run docker:down

# Remove volumes
docker-compose down -v

# Clean test artifacts
rm -rf test-results/ playwright-report/
```

## Troubleshooting

### Services won't start
```bash
docker-compose down -v
docker-compose up -d --force-recreate
docker-compose logs -f
```

### Port already in use
```bash
lsof -i :3000
# Kill the process or change port in docker-compose.yml
```

### Tests failing
```bash
# Check service health
curl http://localhost:3000/healthz

# View Docker logs
npm run docker:logs

# Run in debug mode
npm run test:e2e:debug
```

## Documentation

- [E2E Testing Guide](./E2E_TESTING.md) - Comprehensive documentation
- [Test Summary](./TEST_SUMMARY.md) - Test coverage details
- [Deliverables](./DELIVERABLES.md) - Complete deliverables list
- [README](./README.md) - Project overview

## Common Commands

```bash
npm start              # Start API server
npm run worker         # Start worker
npm run test:e2e       # Run E2E tests
npm run docker:up      # Start Docker stack
npm run docker:down    # Stop Docker stack
npm run docker:logs    # View logs
npm run seed           # Seed test data
```

## Need Help?

1. Check the [Troubleshooting](./E2E_TESTING.md#troubleshooting) section
2. View Docker logs: `npm run docker:logs`
3. Check test artifacts: `test-results/`
4. Run in debug mode: `npm run test:e2e:debug`

---

**Happy Testing! 🎭**
