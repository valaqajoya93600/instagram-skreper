# Railway Infrastructure Notes

This directory captures configuration snippets and operational notes that complement the automated deployment.

## Autoscaling Summary

The desired autoscaling targets are mirrored in [`config/deployment.config.json`](../../config/deployment.config.json). Apply them with the Railway CLI:

```bash
# Web service autoscaling
npx @railway/cli scale web --min 1 --max 3 --cpu 65

# Worker service autoscaling
npx @railway/cli scale worker --min 0 --max 5 --cpu 50
```

Add `--memory <MiB>` if you need to control memory-driven scaling.

## Health Check Endpoints

| Service | Environment variable | Purpose |
| --- | --- | --- |
| API | `API_HEALTHCHECK_URL` | Validates the HTTP API (`/healthz`). |
| Worker | `WORKER_HEALTHCHECK_URL` | Ensures asynchronous workers are accepting jobs. |
| Queue | `QUEUE_HEALTHCHECK_URL` | Confirms the queue consumer is online. |

Each endpoint should return an HTTP `200` status code. The deploy script polls these URLs after every deploy.

## Logging & Monitoring Hooks

Use the Railway CLI to stream logs or export them into your monitoring stack:

```bash
# Tail logs for the web service
npx @railway/cli logs --service web --environment <environment>
```

Integrate the log stream with an observability platform (Datadog, Logtail, etc.) using the CLI output or by configuring Railway's native log forwarding.
