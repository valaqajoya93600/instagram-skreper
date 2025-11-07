# Contributing Guide

Thank you for your interest in contributing to the Railway Deployment Automation project! This guide will help you understand our development process, coding standards, and how to submit your contributions.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Guidelines](#testing-guidelines)
6. [Commit Message Guidelines](#commit-message-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Branching Strategy](#branching-strategy)
9. [Release Process](#release-process)
10. [Reporting Issues](#reporting-issues)
11. [Community](#community)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. We expect all participants to:

- Be respectful and considerate
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

### Unacceptable Behavior

Examples of unacceptable behavior include:

- Harassment, discrimination, or intimidation
- Trolling, insulting, or derogatory comments
- Publishing others' private information
- Other conduct inappropriate for a professional setting

### Enforcement

Violations of the Code of Conduct can be reported to the project maintainers. All complaints will be reviewed and investigated promptly and fairly.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:

1. **Node.js 18+** installed
2. **Git** configured with your name and email
3. **Railway account** (for testing deployment features)
4. **Code editor** with JavaScript/Node.js support (VS Code recommended)

### Initial Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/railway-deploy-automation.git
cd railway-deploy-automation

# 3. Add upstream remote
git remote add upstream https://github.com/original-org/railway-deploy-automation.git

# 4. Install dependencies
npm install

# 5. Create environment file
cp .env.example .env

# 6. Verify setup
npm start
curl http://localhost:3000/healthz
```

### Development Environment

We recommend using:

- **Editor**: VS Code with extensions:
  - ESLint (if configured)
  - Prettier (if configured)
  - JavaScript and TypeScript Nightly
  - GitLens
  
- **Terminal**: iTerm2 (macOS), Windows Terminal, or Tilix (Linux)

- **Node Version Manager**: Use `nvm` to manage Node.js versions:
  ```bash
  nvm use 18
  ```

---

## Development Workflow

### 1. Find or Create an Issue

Before starting work:

- **Check existing issues**: Browse open issues to find something to work on
- **Create a new issue**: If proposing a new feature or bug fix, create an issue first
- **Get assignment**: Comment on the issue to get it assigned to you

### 2. Create a Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description

# Or for documentation
git checkout -b docs/what-you-are-documenting
```

### 3. Make Your Changes

- Write clean, readable code following our [Coding Standards](#coding-standards)
- Add tests for new functionality
- Update documentation as needed
- Test your changes thoroughly

### 4. Commit Your Changes

```bash
# Stage your changes
git add .

# Commit with descriptive message
git commit -m "feat: add new deployment option for skipping health checks"

# See Commit Message Guidelines for format
```

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# - Fill out the PR template
# - Link related issues
# - Request review from maintainers
```

---

## Coding Standards

### JavaScript Style Guide

We follow modern JavaScript best practices with strict mode enabled.

#### General Principles

1. **Explicit is better than implicit**
2. **Readability counts**
3. **Errors should never pass silently**
4. **Simplicity over complexity**

#### Code Style

**Variables and Constants**:
```javascript
// Use const by default
const PORT = 3000;
const apiUrl = process.env.API_URL;

// Use let only when reassignment is necessary
let retryCount = 0;

// Avoid var
// ❌ var shouldNotBeUsed = true;
```

**Naming Conventions**:
```javascript
// Constants: UPPER_SNAKE_CASE
const MAX_RETRIES = 3;
const DATABASE_URL = process.env.DATABASE_URL;

// Functions and variables: camelCase
function calculateTotalPrice(items) { }
const userCount = 42;

// Classes: PascalCase
class CircuitBreaker { }
class DeploymentOrchestrator { }

// Private methods: prefix with underscore (convention)
class Example {
  _privateMethod() { }
  publicMethod() { }
}

// File names: kebab-case
// deploy-orchestrator.js
// health-check-service.js
```

**Functions**:
```javascript
// Use descriptive names
// ❌ Bad
function f(x) { return x * 2; }

// ✅ Good
function calculateDoubleAmount(amount) {
  return amount * 2;
}

// Keep functions small and focused (single responsibility)
// ✅ Good
function deployService(serviceName) {
  validateService(serviceName);
  buildDockerImage(serviceName);
  pushToRegistry(serviceName);
  runHealthCheck(serviceName);
}

// Use early returns to avoid nesting
// ✅ Good
function processUser(user) {
  if (!user) return null;
  if (!user.isActive) return null;
  
  return performUserOperation(user);
}
```

**Error Handling**:
```javascript
// Always handle errors explicitly
// ❌ Bad
async function fetchData() {
  const response = await fetch(url);
  return response.json();
}

// ✅ Good
async function fetchData(url) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error.message);
    throw error;
  }
}

// Validate inputs
function divide(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Arguments must be numbers');
  }
  
  if (b === 0) {
    throw new Error('Division by zero');
  }
  
  return a / b;
}
```

**Async/Await**:
```javascript
// Prefer async/await over callbacks
// ❌ Bad
function getData(callback) {
  fetch(url, (error, response) => {
    if (error) return callback(error);
    callback(null, response);
  });
}

// ✅ Good
async function getData(url) {
  const response = await fetch(url);
  return response.json();
}

// Handle multiple promises
// Use Promise.all for parallel operations
const [users, posts, comments] = await Promise.all([
  fetchUsers(),
  fetchPosts(),
  fetchComments(),
]);

// Use Promise.allSettled for independent operations
const results = await Promise.allSettled([
  deployService('web'),
  deployService('worker'),
  deployService('queue'),
]);
```

**Comments**:
```javascript
// Use comments to explain "why", not "what"
// ❌ Bad
// Increment counter by 1
counter++;

// ✅ Good
// Retry count must be incremented before exponential backoff calculation
counter++;

// Use JSDoc for functions
/**
 * Deploys a service to Railway with health check validation.
 * 
 * @param {string} serviceName - Name of the service to deploy
 * @param {Object} options - Deployment options
 * @param {boolean} options.skipMigrations - Skip database migrations
 * @param {boolean} options.skipHealthChecks - Skip health validation
 * @returns {Promise<void>}
 * @throws {Error} If deployment or health check fails
 */
async function deployService(serviceName, options = {}) {
  // Implementation
}
```

**Module Structure**:
```javascript
'use strict';

// 1. Node.js built-in modules
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

// 2. External dependencies (none in this project)

// 3. Local modules
const { validateConfig } = require('./utils/validation');
const { runCommand } = require('./utils/process');

// 4. Constants
const DEFAULT_PORT = 3000;
const MAX_RETRIES = 3;

// 5. Functions
function main() {
  // Implementation
}

// 6. Exports
module.exports = { main };

// 7. Execute if main module
if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
```

### Configuration Standards

**JSON Files**:
```json
{
  "property": "value",
  "nestedObject": {
    "key": "value"
  },
  "array": [
    "item1",
    "item2"
  ]
}
```

**Environment Variables**:
- Use UPPER_SNAKE_CASE
- Group related variables with common prefixes
- Document all variables in `.env.example`
- Never commit actual values

---

## Testing Guidelines

### Testing Requirements

All contributions should include appropriate tests:

1. **New features**: Add unit tests and integration tests
2. **Bug fixes**: Add regression tests to prevent recurrence
3. **Refactoring**: Ensure existing tests still pass
4. **Documentation**: Update relevant documentation

### Running Tests

```bash
# Run all tests (when test suite exists)
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- src/utils/sanitize.test.js

# Run with coverage
npm test -- --coverage
```

### Writing Tests

**Unit Test Example**:
```javascript
// tests/unit/utils.test.js
const { sanitizeConnectionString } = require('../../src/utils');

describe('sanitizeConnectionString', () => {
  it('should redact password from PostgreSQL connection string', () => {
    const input = 'postgresql://user:secret@host:5432/db';
    const output = sanitizeConnectionString(input);
    expect(output).toBe('postgresql://user:***@host:5432/db');
  });

  it('should handle connection strings without password', () => {
    const input = 'postgresql://user@host:5432/db';
    const output = sanitizeConnectionString(input);
    expect(output).toBe('postgresql://user@host:5432/db');
  });

  it('should handle invalid connection strings', () => {
    const input = 'not-a-valid-url';
    const output = sanitizeConnectionString(input);
    expect(output).toBe('***');
  });
});
```

**Integration Test Example**:
```javascript
// tests/integration/server.test.js
const request = require('supertest');
const { createServer } = require('../../src/index');

describe('HTTP Server', () => {
  let server;

  beforeEach(() => {
    server = createServer();
  });

  afterEach((done) => {
    server.close(done);
  });

  describe('GET /healthz', () => {
    it('should return 200 OK', async () => {
      const response = await request(server).get('/healthz');
      
      expect(response.status).toBe(200);
      expect(response.type).toBe('application/json');
      expect(response.body).toEqual({
        status: 'ok',
        uptimeSeconds: expect.any(Number),
        timestamp: expect.any(String),
      });
    });
  });

  describe('GET /', () => {
    it('should return service information', async () => {
      const response = await request(server).get('/');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('healthcheck', '/healthz');
    });
  });
});
```

### Test Coverage Goals

Maintain high test coverage:
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

---

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type

Must be one of:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes only
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without functionality changes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (dependencies, build, etc.)
- **ci**: CI/CD configuration changes

### Scope (optional)

The scope should indicate the area affected:

- **deploy**: Deployment scripts
- **health**: Health check system
- **config**: Configuration files
- **api**: HTTP API server
- **docs**: Documentation
- **infra**: Infrastructure configuration

### Subject

- Use imperative mood: "add" not "added" or "adds"
- Don't capitalize first letter
- No period at the end
- Maximum 72 characters

### Body (optional)

- Explain the motivation for the change
- Contrast with previous behavior
- Wrap at 72 characters

### Footer (optional)

- Reference issues: `Closes #123`, `Fixes #456`
- Breaking changes: `BREAKING CHANGE: description`

### Examples

**Feature**:
```
feat(deploy): add --skip-migrations flag

Allow deployments without running database migrations for faster
deployments in scenarios where schema hasn't changed.

Closes #42
```

**Bug Fix**:
```
fix(health): handle connection timeouts gracefully

Previously, connection timeouts would cause unhandled promise
rejections. Now properly caught and retried according to
configured retry policy.

Fixes #73
```

**Documentation**:
```
docs(api): add examples for health check endpoint

Include curl examples and common error scenarios to help users
troubleshoot health check failures.
```

**Breaking Change**:
```
feat(config): change environment variable prefix

BREAKING CHANGE: All Railway-related environment variables now use
RAILWAY_ prefix instead of RW_ for consistency with Railway CLI.

Users must update their environment configurations:
- RW_TOKEN -> RAILWAY_TOKEN
- RW_PROJECT_ID -> RAILWAY_PROJECT_ID
- RW_ENVIRONMENT -> RAILWAY_ENVIRONMENT

Closes #88
```

---

## Pull Request Process

### Before Submitting

Ensure your PR meets these criteria:

- [ ] Code follows project coding standards
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Documentation updated (API.md, ARCHITECTURE.md, etc.)
- [ ] Commit messages follow guidelines
- [ ] Branch is up-to-date with main
- [ ] No merge conflicts

### PR Template

When creating a PR, include:

```markdown
## Description
Brief description of the changes and why they were made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issues
Closes #(issue number)

## How Has This Been Tested?
Describe the tests you ran to verify your changes.

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Screenshots (if applicable)
Add screenshots to demonstrate UI changes or new features.
```

### Review Process

1. **Automated Checks**: CI/CD runs tests and linting
2. **Code Review**: Maintainers review your code
3. **Revisions**: Address feedback with new commits
4. **Approval**: Get approval from at least one maintainer
5. **Merge**: Maintainer merges your PR

### Review Timeline

- **Simple fixes**: 1-2 days
- **New features**: 3-5 days
- **Major changes**: 1-2 weeks

### Addressing Feedback

```bash
# Make requested changes
git add .
git commit -m "refactor: address review feedback"

# Push to update PR
git push origin feature/your-feature-name

# If force push needed (after rebase)
git push --force-with-lease origin feature/your-feature-name
```

---

## Branching Strategy

### Branch Types

| Branch | Purpose | Naming Convention | Lifetime |
| --- | --- | --- | --- |
| `main` | Production-ready code | `main` | Permanent |
| `develop` | Integration branch | `develop` | Permanent |
| Feature | New features | `feature/<description>` | Temporary |
| Bugfix | Bug fixes | `fix/<issue-description>` | Temporary |
| Hotfix | Urgent production fixes | `hotfix/<issue-description>` | Temporary |
| Release | Release preparation | `release/v<version>` | Temporary |
| Documentation | Docs updates | `docs/<topic>` | Temporary |

### Branch Naming

**Good Examples**:
- `feature/add-retry-logic`
- `fix/health-check-timeout`
- `docs/update-setup-guide`
- `refactor/simplify-config-loading`

**Bad Examples**:
- `new-feature` (not descriptive)
- `fix` (too generic)
- `johns-branch` (not descriptive)
- `FEATURE/Add-Retry-Logic` (incorrect case)

### Workflow

```bash
# Start new feature
git checkout main
git pull origin main
git checkout -b feature/my-new-feature

# Work on feature, commit regularly
git add .
git commit -m "feat: implement feature X"

# Keep up-to-date with main
git checkout main
git pull origin main
git checkout feature/my-new-feature
git rebase main

# Push and create PR
git push origin feature/my-new-feature
```

---

## Release Process

### Version Numbers

We follow [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Create Release Branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b release/v1.2.0
   ```

2. **Update Version**:
   ```bash
   npm version minor  # or major/patch
   ```

3. **Update CHANGELOG**:
   ```markdown
   ## [1.2.0] - 2024-11-07
   
   ### Added
   - New retry logic for health checks
   - Support for custom health check intervals
   
   ### Changed
   - Improved error messages in deployment script
   
   ### Fixed
   - Health check timeout handling
   ```

4. **Test Release**:
   ```bash
   npm install
   npm test
   npm run deploy -- --dry-run
   ```

5. **Create Pull Request**:
   - Title: "Release v1.2.0"
   - Include changelog in description
   - Request reviews from maintainers

6. **Merge and Tag**:
   ```bash
   git checkout main
   git merge release/v1.2.0
   git tag v1.2.0
   git push origin main --tags
   ```

7. **Deploy to Production**:
   ```bash
   npm run deploy
   ```

8. **Create GitHub Release**:
   - Go to GitHub Releases
   - Create new release from tag
   - Include changelog
   - Attach any release artifacts

---

## Reporting Issues

### Before Reporting

- **Search existing issues**: Your issue might already be reported
- **Check documentation**: Ensure it's not a usage question
- **Try latest version**: Bug might be fixed in newer version

### Bug Report Template

```markdown
## Bug Description
Clear and concise description of the bug.

## Steps to Reproduce
1. Run command X
2. Set environment variable Y
3. Observe error Z

## Expected Behavior
What you expected to happen.

## Actual Behavior
What actually happened.

## Environment
- OS: [e.g., macOS 13.0, Ubuntu 22.04]
- Node.js version: [e.g., 18.17.0]
- Project version: [e.g., 0.1.0]

## Logs
```
Paste relevant logs here
```

## Possible Solution (optional)
Suggest a fix if you have ideas.
```

### Feature Request Template

```markdown
## Feature Description
Clear and concise description of the feature.

## Problem Statement
Describe the problem this feature would solve.

## Proposed Solution
Detailed description of how it should work.

## Alternatives Considered
Other solutions you've considered.

## Additional Context
Any other context, mockups, or examples.
```

---

## Community

### Communication Channels

- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, general discussion
- **Pull Requests**: Code contributions

### Getting Help

- **Documentation**: Check the docs in this repository
- **Issues**: Search existing issues for solutions
- **Discussions**: Ask questions in GitHub Discussions

### Recognition

We value all contributions:

- Contributors are listed in CONTRIBUTORS.md
- Significant contributions recognized in release notes
- Top contributors may be invited as maintainers

---

## Questions?

If you have questions about contributing:

1. Check this guide thoroughly
2. Review other documentation (SETUP.md, ARCHITECTURE.md)
3. Search existing GitHub Issues
4. Open a new issue with the "question" label

Thank you for contributing to Railway Deployment Automation! 🚀
