# Railway Deployment Automation

A comprehensive deployment automation framework for Railway-based applications with multi-service orchestration, health checks, and migration management.

---

## Overview

This project provides automated deployment tooling for Railway platform with:

- **Multi-Service Deployment**: Orchestrate web, worker, and queue services
- **Health Check System**: Automated post-deployment validation
- **Migration Management**: Database migration execution during deployment
- **Environment Configuration**: Multi-environment support with secure credential management
- **Autoscaling Control**: Declarative autoscaling configuration
- **Rollback Support**: Quick rollback to previous deployment versions

## Quick Start

```bash
# Clone repository
git clone <repository-url>
cd railway-deploy-automation

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm start

# Test the server
curl http://localhost:3000/healthz
```

## Documentation

Comprehensive documentation is available in the following guides:

### Getting Started

- **[SETUP.md](./SETUP.md)** - Complete setup guide for local development and Railway deployment
  - Prerequisites and installation
  - Environment configuration
  - Railway, database, and R2 setup
  - Running the application
  - Troubleshooting

### Core Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design
  - Architecture overview and diagrams
  - Core components explanation
  - Data flow and deployment pipeline
  - Service architecture
  - Design decisions and rationale

- **[API.md](./API.md)** - HTTP API reference
  - Endpoint documentation
  - Request/response schemas
  - Health check configuration
  - Error handling
  - Testing and monitoring

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Railway deployment guide
  - Deployment process and workflow
  - Environment variables and secrets
  - Health checks and validation
  - Autoscaling configuration
  - Rollback procedures
  - Troubleshooting deployment issues

### Best Practices & Contributing

- **[BEST_PRACTICES.md](./BEST_PRACTICES.md)** - Operational best practices
  - Deployment strategies and checklists
  - Environment management
  - Database operations
  - Monitoring and observability
  - Security practices
  - Performance optimization
  - Error handling and recovery

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
  - Code of conduct
  - Development workflow
  - Coding standards
  - Testing guidelines
  - Commit message format
  - Pull request process
  - Branching strategy

## Project Structure

```
railway-deploy-automation/
├── config/
│   └── deployment.config.json   # Service configuration
├── infra/
│   └── railway/                 # Infrastructure notes
├── scripts/
│   ├── deploy.js                # Deployment orchestration
│   └── migrate.js               # Database migration runner
├── src/
│   └── index.js                 # HTTP server
├── .env.example                 # Environment variable template
├── Dockerfile                   # Container definition
├── package.json                 # Project dependencies
└── [Documentation]              # API.md, SETUP.md, etc.
```

## Features

### Automated Deployment

Deploy multiple services to Railway with a single command:

```bash
npm run deploy
```

The deployment script:
1. Validates environment configuration
2. Deploys each configured service
3. Runs database migrations
4. Performs health checks
5. Reports deployment status

### Health Check System

Comprehensive health monitoring with configurable:
- Health check URLs per service
- Expected status codes
- Timeout durations
- Retry intervals
- Request timeouts

### Multi-Environment Support

Manage separate configurations for:
- Development
- Staging
- Production

### Declarative Configuration

All deployment settings in version-controlled `config/deployment.config.json`:

```json
{
  "services": [
    {
      "name": "web",
      "deploy": true,
      "migrateCommand": ["npm", "run", "migrate"],
      "healthCheck": {
        "urlEnv": "API_HEALTHCHECK_URL",
        "expectedStatus": 200
      },
      "autoscale": {
        "minReplicas": 1,
        "maxReplicas": 3,
        "cpuTargetPercentage": 65
      }
    }
  ]
}
```

## Commands

### Development

```bash
npm start                    # Start HTTP server
npm run migrate             # Run database migrations
```

### Deployment

```bash
npm run deploy              # Deploy to Railway
npm run deploy -- --dry-run # Preview deployment without executing
npm run deploy -- --skip-migrations # Deploy without running migrations
npm run deploy -- --skip-health-checks # Deploy without health validation
```

### Railway CLI

```bash
npx @railway/cli login      # Authenticate with Railway
npx @railway/cli link       # Link to Railway project
npx @railway/cli status     # Check deployment status
npx @railway/cli logs       # View service logs
npx @railway/cli variables  # Manage environment variables
```

## Environment Variables

Key environment variables (see `.env.example` for complete list):

| Variable | Purpose |
| --- | --- |
| `RAILWAY_TOKEN` | Railway API authentication |
| `RAILWAY_PROJECT_ID` | Railway project identifier |
| `RAILWAY_ENVIRONMENT` | Target environment (dev/staging/production) |
| `DATABASE_URL` | Database connection string |
| `API_HEALTHCHECK_URL` | Health check endpoint URL |
| `R2_*` | Cloudflare R2 storage credentials |
| `PORT` | HTTP server port (default: 3000) |

See [SETUP.md](./SETUP.md) for detailed environment configuration.

## Technology Stack

- **Runtime**: Node.js 18+
- **Platform**: Railway (PaaS)
- **Container**: Docker (Alpine Linux)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Database**: PostgreSQL/MySQL (generic support)

## Requirements

- Node.js 18.x or newer
- npm 9.x or newer
- Railway account with project access
- Docker (optional, for local container testing)

## Health Checks

The service exposes a `/healthz` endpoint for monitoring:

```bash
curl http://localhost:3000/healthz
```

Response:
```json
{
  "status": "ok",
  "uptimeSeconds": 123.45,
  "timestamp": "2024-11-07T18:00:00.000Z"
}
```

See [API.md](./API.md) for complete endpoint documentation.

## Deployment Workflow

1. **Configure** environment variables in Railway
2. **Deploy** using `npm run deploy`
3. **Monitor** deployment progress and logs
4. **Verify** health checks pass
5. **Rollback** if issues detected

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment procedures.

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Code of conduct
- Development workflow
- Coding standards
- Testing guidelines
- Pull request process

## Support

- **Documentation**: Check the docs in this repository
- **Issues**: Report bugs or request features via GitHub Issues
- **Questions**: Use GitHub Discussions for questions

## License

MIT License - see LICENSE file for details

## Acknowledgments

Built with:
- [Railway](https://railway.app/) - Deployment platform
- [Node.js](https://nodejs.org/) - JavaScript runtime
- [Cloudflare R2](https://www.cloudflare.com/products/r2/) - Object storage

---

For detailed documentation, start with [SETUP.md](./SETUP.md) to get the project running locally, then explore the other documentation files for deeper understanding of the system architecture, API, and best practices.
