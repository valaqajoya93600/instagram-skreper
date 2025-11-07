# Railway Deployment Guide

This document describes how to deploy the project to the Railway test/production environments using the automated tooling shipped with the repository. It captures the environment configuration, monitoring, scaling, and rollback procedures required to operate the app in production.

---

## 1. Prerequisites

1. **Node.js** v18 or newer.
2. **Railway account** with access to the target project and environments.
3. **Cloudflare R2** bucket (if object storage is required) with API credentials.
4. **Railway CLI** (fetched automatically through `npx @railway/cli`).

Ensure you have authenticated the CLI locally:

```bash
npx @railway/cli login
```

The deployment script expects to find a valid `RAILWAY_TOKEN` in the environment. You can retrieve it from the Railway Dashboard under **Account → Access Tokens**.

---

## 2. Repository Structure

- `scripts/deploy.js` &mdash; Orchestrates the end-to-end deploy via the Railway CLI.
- `scripts/migrate.js` &mdash; Placeholder for database migration execution (customise with your migration tool).
- `config/deployment.config.json` &mdash; Declarative configuration for services, health checks, and autoscaling targets.
- `Dockerfile` &mdash; Container build definition consumed by Railway.
- `.env.example` &mdash; Baseline of required environment variables and secrets.

---

## 3. Environment Variables & Secrets

Populate the following variables in your Railway environment (via the Dashboard **Variables** tab or with the CLI using `npx @railway/cli variables set KEY=value`).

| Variable | Description |
| --- | --- |
| `RAILWAY_TOKEN` | Railway API token used by the automation (store locally, **do not** check in).
| `RAILWAY_PROJECT_ID` | Railway project identifier (used for linking when running locally).
| `RAILWAY_ENVIRONMENT` | Target environment name (defaults to `production`).
| `DATABASE_URL` | Connection string for the primary database.
| `API_HEALTHCHECK_URL` | HTTPS URL used to validate the API service post-deploy.
| `WORKER_HEALTHCHECK_URL` | HTTPS URL for the background worker.
| `QUEUE_HEALTHCHECK_URL` | HTTPS URL for the queue/consumer service.
| `R2_ACCOUNT_ID` | Cloudflare R2 Account ID.
| `R2_ACCESS_KEY_ID` | Cloudflare R2 Access Key (public key).
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 Secret Key.
| `R2_BUCKET_NAME` | Bucket name that the application uses.
| `R2_PUBLIC_BUCKET_URL` | Public CDN/base URL for serving files (if applicable).

Add any additional application-specific secrets to the same location. You can prime your local environment by copying `.env.example` to `.env.deploy` and filling the values.

---

## 4. Docker Deployment Configuration

Railway will build and deploy the repository using the provided `Dockerfile`. Ensure the Docker image exposes the correct port (`PORT` defaults to `3000` in `src/index.js`).

For multi-service deployments, link each Railway service (web, worker, queue) to the repository directory:

```bash
npx @railway/cli link <service-id-or-name>
# or interactively follow the prompts without arguments
```

Once linked, you may switch environments without prompting:

```bash
npx @railway/cli environment use <environment-name>
```

The deploy script also accepts the `RAILWAY_ENVIRONMENT` environment variable or reads the default value from `config/deployment.config.json`.

---

## 5. Running a Deployment

Install dependencies (if any) and run the deploy script:

```bash
npm install
npm run deploy
```

### What the script does

1. Loads environment variables from `.env.deploy`, `.env.production`, and `.env` (if present).
2. Deploys each service flagged with `"deploy": true` in `config/deployment.config.json` using `npx @railway/cli up`.
3. Runs database migrations via `npx @railway/cli run ...` invoking the `npm run migrate` script (modify as needed for your migration tool).
4. Polls the configured health-check endpoints for the API, worker, and queue until they respond with the expected status code.

### Optional flags

- `npm run deploy -- --dry-run` &mdash; Prints all Railway commands without executing them.
- `npm run deploy -- --skip-migrations` &mdash; Skips the migration step.
- `npm run deploy -- --skip-health-checks` &mdash; Skips the post-deploy health verification.

> **Tip:** When running within CI, export `RAILWAY_TOKEN`, `RAILWAY_PROJECT_ID`, and `RAILWAY_ENVIRONMENT` as secrets and invoke the same `npm run deploy` command.

---

## 6. Health Checks

Define the health-check URLs in the Railway environment or via deployment configuration.

- **API (`API_HEALTHCHECK_URL`)**: Should map to the `/healthz` endpoint exposed by the HTTP service.
- **Worker (`WORKER_HEALTHCHECK_URL`)**: A lightweight endpoint returning operational status of the worker process.
- **Queue (`QUEUE_HEALTHCHECK_URL`)**: Endpoint or queue diagnostic URL that ensures the consumer loop is healthy.

Update `config/deployment.config.json` if the expected status code, timeouts, or polling intervals need to be customised.

---

## 7. Autoscaling & Resource Configuration

Autoscaling targets per service are captured in `config/deployment.config.json` under the `autoscale` section. Apply the configuration in Railway with the CLI (or through the dashboard):

```bash
# Example: scale the web service
npx @railway/cli scale web --min 1 --max 3 --cpu 65

# Example: scale the worker service
npx @railway/cli scale worker --min 0 --max 5 --cpu 50
```

Adjust the CPU utilisation thresholds as your workload demands. Railway also supports setting memory limits; include `--memory <MiB>` if required. Document any changes directly in the JSON configuration to keep the desired state in version control.

For monitoring and logging, forward build/deploy logs to your observability stack via:

```bash
npx @railway/cli logs --service web --environment <environment-name>
```

You can stream logs into systems such as Datadog or Logtail by piping the output.

---

## 8. Cloudflare R2 Integration

Ensure the R2 credentials listed above are added to the Railway environment. The application should read these variables to configure storage clients (S3-compatible libraries). Suggested validation during deployment:

1. Ensure `R2_BUCKET_NAME` is reachable by running a smoke test in your CI/CD pipeline.
2. If the application needs to create buckets in production, grant the access key the necessary permissions.
3. Store the `R2_PUBLIC_BUCKET_URL` (or Cloudflare Worker URL) so that health checks or CDN rewrites know where to redirect traffic.

Update your application layer to fail fast on missing R2 credentials so that the health check catches misconfiguration.

---

## 9. Post-Deploy Verification

After `npm run deploy` succeeds, the script already validates the health endpoints. You can perform additional manual verification:

```bash
# View the latest deployment status
npx @railway/cli status

# Tail live logs
npx @railway/cli logs --service web --environment <environment-name>
```

If any health check fails, the deploy script will exit with a non-zero status, allowing CI pipelines to abort automatically.

---

## 10. Rollback Procedure

Railway retains previous deployment images. To redeploy the last known good image:

```bash
# Redeploy the previous successful image for the web service
npx @railway/cli deployment redeploy --service web --environment <environment-name>
```

If the newest deployment is unhealthy, you may also roll back via the dashboard by selecting the earlier deployment in the “Deployments” tab and clicking **Rollback**.

For a full rollback automation, script the following steps:

1. `npx @railway/cli deployment list --service web --environment <environment-name>` to identify the last green deployment ID.
2. `npx @railway/cli deployment redeploy --service web --deployment <deployment-id>` to restore it.
3. Run `npm run deploy -- --skip-migrations` to re-verify the environment once the rollback completes.

Document the deployment ID used for the rollback inside your incident notes or ticketing system.

---

## 11. Troubleshooting

- **Authentication errors:** Ensure `RAILWAY_TOKEN` is populated and the token has access to the project.
- **Project linking prompts:** Export `RAILWAY_PROJECT_ID` and run `npx @railway/cli link $RAILWAY_PROJECT_ID` once locally to persist the linkage in `.railway/config.json` (not committed).
- **Health check timeouts:** Verify the endpoint URLs resolve from the public internet and that TLS certificates are valid.
- **Migration failures:** Edit `scripts/migrate.js` to invoke your migration tool (`prisma migrate deploy`, `sequelize-cli db:migrate`, etc.) and re-run the deploy.

---

## 12. Next Steps

- Replace the placeholder HTTP server in `src/index.js` with the real application entry point.
- Integrate your migration runner within `scripts/migrate.js`.
- Add automated smoke tests that can be triggered post-deploy (extend `scripts/deploy.js` accordingly).

By keeping the configuration files and documentation in sync, the Railway deployment pipeline can be executed predictably from any developer workstation or CI environment.
