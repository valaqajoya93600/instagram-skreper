# Railway Deployment Automation

This repository contains a minimal Node.js service and supporting scripts used to automate deployments on Railway. It exposes a health check endpoint and provides deployment utilities for use in CI/CD pipelines.

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the service locally**

   ```bash
   npm start
   ```

   The HTTP server listens on port `3000` by default and exposes the `/healthz` endpoint.

3. **Run quality checks locally**

   ```bash
   npm run lint
   npm run test:unit
   npm run test:integration
   npm run test:e2e
   ```

   Integration tests require Postgres and Redis services. You can spin them up locally with Docker:

   ```bash
   docker run --rm -e POSTGRES_PASSWORD=ci -e POSTGRES_USER=ci -e POSTGRES_DB=app -p 5432:5432 postgres:15
   docker run --rm -p 6379:6379 redis:7
   ```

## Available Scripts

| Script | Description |
| ------ | ----------- |
| `npm run lint` | Run ESLint across the project. |
| `npm test` / `npm run test:unit` | Execute unit tests. Pass `-- --coverage` to include coverage. |
| `npm run test:integration` | Run integration tests against Postgres and Redis (requires running services). |
| `npm run test:coverage` | Generate a coverage report from the unit test suite. |
| `npm run test:e2e` | Execute the Playwright end-to-end tests (downloads browsers on first run). |
| `npm run ci` | Run linting, tests, and e2e checks in sequence (mirrors the CI workflow). |
| `npm run audit` | Execute `npm audit --production` for dependency security scanning. |

Coverage reports are written to the `coverage/` directory and include LCOV, text, and summary formats.

## Continuous Integration

The GitHub Actions workflow defined in `.github/workflows/test.yml` runs on every push and pull request. It performs the following checks on Node.js 18 and 20:

- Restores npm cache and installs dependencies with `npm ci`.
- Runs ESLint to enforce code quality.
- Executes unit tests with coverage enabled, publishing both console summaries and artifact uploads.
- Spins up Postgres and Redis service containers for integration tests that exercise real connections.
- Installs Playwright browsers and runs end-to-end tests against the local HTTP server using the shared Playwright configuration.
- Executes an `npm audit --production` security scan.
- Builds Docker images for the backend service (and conditionally for a frontend image if present).
- Publishes coverage data and documentation artifacts (README, CONTRIBUTING, DEPLOYMENT) for reference in the Actions UI.

The workflow fails fast whenever linting, tests, or security checks fail, ensuring that the default branch remains healthy.

## Deployment

Deployment automation scripts live under `scripts/` and rely on Railway CLI commands. Review `DEPLOYMENT.md` for more details on deploying to Railway and configuring environment variables.
