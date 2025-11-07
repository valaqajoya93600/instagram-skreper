# Contributing Guidelines

Thanks for your interest in improving this project! The following guidelines help ensure contributions are consistent and easy to review.

## Development Workflow

1. Fork the repository and create a feature branch.
2. Install dependencies with `npm install`.
3. Make your changes following the existing coding style (ESLint enforces the basics).
4. Ensure the quality gates pass locally before opening a pull request:

   ```bash
   npm run lint
   npm run test:unit -- --coverage
   npm run test:integration
   npm run test:e2e
   npm run audit
   ```

   Integration tests depend on Postgres and Redis running locally. You can use Docker commands shown in the [README](README.md#available-scripts) section to bring them online.

5. Update documentation and tests related to your changes.
6. Open a pull request that clearly describes the problem and solution.

## Continuous Integration

All pull requests trigger the GitHub Actions workflow located at `.github/workflows/test.yml`. The pipeline:

- Runs linting on Node.js 18 and 20.
- Executes unit tests with coverage; summaries are output to the Action logs and stored as artifacts.
- Executes integration tests against service containers for Postgres and Redis.
- Installs browsers and runs the Playwright end-to-end suite.
- Performs an `npm audit --production` security scan.
- Builds Docker images to ensure container definitions stay healthy.
- Publishes coverage and documentation artifacts for later inspection.

Pull requests must pass the full workflow before they can be merged. If a step fails, address the underlying issue rather than disabling the check.

## Coding Standards

- Use modern JavaScript (`es2022`) with CommonJS modules.
- New code should include corresponding tests. Prefer unit tests for core logic and integration or end-to-end tests when interacting with external services.
- Keep functions small and focused; shared logic belongs in dedicated modules.
- Avoid inline comments unless the behavior is non-obvious.

We appreciate your contributions! If you have questions, please open an issue before starting major work.
