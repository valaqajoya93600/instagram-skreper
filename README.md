# Instagram Scraper Platform

A comprehensive Instagram scraping platform with full E2E testing coverage using Playwright.

## Features

- 📸 **Instagram Profile Scraping** - Extract posts, engagement metrics, and media
- 🔄 **Asynchronous Processing** - Queue-based task management with Bull & Redis
- 💾 **Data Persistence** - PostgreSQL for task tracking and results
- ☁️ **S3 Storage** - Export data to S3-compatible storage (LocalStack for local dev)
- 🔐 **Challenge Handling** - Support for Instagram 2FA/SMS challenges
- ⏱️ **Rate Limiting** - Graceful handling of Instagram rate limits
- 📊 **Real-time Monitoring** - Track scraping progress and task status
- 📦 **Export Downloads** - Download scraped data as JSON
- ✅ **Comprehensive E2E Tests** - 60+ Playwright test scenarios

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js v18+
- npm

### Installation

```bash
# Clone repository
git clone <repository-url>
cd instagram-scraper

# Install dependencies
npm install

# Install Playwright browsers
npm run setup:e2e

# Copy environment variables
cp .env.example .env
```

### Running Locally

```bash
# Start all services (PostgreSQL, Redis, LocalStack, API, Worker)
npm run docker:up

# Verify services are running
curl http://localhost:3000/healthz

# Access the web interface
open http://localhost:3000
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in interactive UI mode
npm run test:e2e:ui

# Run tests with browser visible
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug
```

See [E2E_TESTING.md](./E2E_TESTING.md) for comprehensive testing documentation.

## Architecture

```
┌─────────────┐
│  Web UI     │ (Static HTML/JS)
└──────┬──────┘
       │
       │ HTTP
       ▼
┌─────────────┐
│  API Server │ (Express.js)
└──────┬──────┘
       │
       ├─────────┐
       │         │
       ▼         ▼
┌──────────┐ ┌──────────┐
│PostgreSQL│ │  Redis   │
│          │ │  (Queue) │
└──────────┘ └────┬─────┘
                  │
                  ▼
            ┌──────────┐
            │  Worker  │ (Bull Job Processor)
            └────┬─────┘
                 │
                 ▼
            ┌──────────┐
            │   S3     │ (Export Storage)
            └──────────┘
```

## API Endpoints

### Scraping

- `POST /api/scrape` - Create a new scrape task
  ```json
  { "username": "instagram_user" }
  ```

- `GET /api/tasks/:taskId` - Get task details
- `GET /api/tasks` - List all tasks (supports `?status=`, `?limit=`, `?offset=`)
- `POST /api/tasks/:taskId/cancel` - Cancel a running task
- `POST /api/tasks/:taskId/resolve-challenge` - Resolve Instagram challenge
  ```json
  { "code": "123456" }
  ```

### Exports

- `GET /api/tasks/:taskId/download` - Download task export as JSON

### Health

- `GET /healthz` - Service health check

## Task States

- **pending** - Task created, waiting to be processed
- **processing** - Currently scraping
- **challenge_required** - Instagram requires verification
- **rate_limited** - Hit Instagram rate limit
- **completed** - Successfully completed
- **failed** - Error occurred
- **cancelled** - User cancelled

## Development

### Project Structure

```
.
├── src/
│   ├── index.js              # API server
│   ├── public/               # Frontend files
│   │   └── index.html        # Web UI
│   └── worker/
│       ├── index.js          # Job processor
│       └── instagram-mock.js # Mock Instagram responses
├── tests/
│   └── e2e/                  # Playwright E2E tests
│       ├── fixtures/         # Test helpers
│       └── *.spec.js         # Test suites
├── config/
│   └── deployment.config.json
├── scripts/
│   ├── deploy.js             # Railway deployment
│   ├── migrate.js            # Database migrations
│   └── seed.js               # Seed test data
├── docker-compose.yml        # Local dev environment
├── playwright.config.js      # Playwright configuration
└── init.sql                  # Database schema
```

### Available Scripts

```bash
npm start                # Start API server
npm run dev              # Start with nodemon (auto-reload)
npm run worker           # Start worker process
npm run test:e2e         # Run E2E tests
npm run test:e2e:ui      # Run E2E tests in UI mode
npm run test:e2e:debug   # Debug E2E tests
npm run docker:up        # Start Docker services
npm run docker:down      # Stop Docker services
npm run docker:logs      # View Docker logs
npm run setup:e2e        # Install Playwright browsers
```

### Adding Test Data

Use special usernames to trigger different scenarios:

- `*challenge*` → Triggers Instagram challenge flow
- `*ratelimit*` → Triggers rate limiting
- `*error*` → Triggers error state
- Other → Successful scrape

### Environment Variables

See `.env.example` for all available configuration options.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `AWS_S3_BUCKET` - S3 bucket name
- `AWS_S3_ENDPOINT` - S3 endpoint (use LocalStack for local dev)
- `MOCK_INSTAGRAM` - Enable mocked Instagram responses

## Deployment

### Railway

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Railway deployment instructions.

### Docker Production

```bash
# Build image
docker build -t instagram-scraper .

# Run with environment variables
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  -e AWS_S3_BUCKET=... \
  instagram-scraper
```

## Testing Strategy

The E2E test suite covers:

1. **Successful Scrape Workflow** - End-to-end happy path
2. **Challenge Flow** - Instagram 2FA/SMS verification
3. **Rate Limiting** - Handling API rate limits
4. **Task Monitoring** - Progress tracking and updates
5. **Export Download** - Data export and validation
6. **Task Cancellation** - User-initiated cancellation
7. **Error States** - Error handling and validation
8. **UI Validation** - User interface testing
9. **API Integration** - API endpoint testing
10. **S3 Storage** - Storage integration testing

Total: **60+ test scenarios** across **10 test suites**

### Test Artifacts

Tests automatically capture on failure:
- Screenshots
- Videos
- Traces (time-travel debugging)
- Network logs

View reports:
```bash
npx playwright show-report test-results/html-report
```

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run E2E Tests
  run: |
    npm ci
    npm run setup:e2e
    docker-compose up -d
    npm run test:e2e
```

### GitLab CI

```yaml
e2e-tests:
  script:
    - npm ci
    - docker-compose up -d
    - npm run test:e2e
  artifacts:
    paths:
      - test-results/
```

See [E2E_TESTING.md](./E2E_TESTING.md) for detailed CI/CD examples.

## Troubleshooting

### Services won't start

```bash
docker-compose down -v
docker-compose up -d --force-recreate
docker-compose logs -f
```

### Tests failing

```bash
# Check service health
curl http://localhost:3000/healthz

# View logs
npm run docker:logs

# Run tests in debug mode
npm run test:e2e:debug
```

### Port conflicts

```bash
# Check what's using the port
lsof -i :3000

# Kill the process or change port in docker-compose.yml
```

See [E2E_TESTING.md](./E2E_TESTING.md) for comprehensive troubleshooting guide.

## Contributing

1. Create a feature branch
2. Write tests for new features
3. Ensure all tests pass: `npm run test:e2e`
4. Submit pull request

## License

MIT

## Documentation

- [E2E Testing Guide](./E2E_TESTING.md) - Comprehensive testing documentation
- [Deployment Guide](./DEPLOYMENT.md) - Railway deployment instructions
