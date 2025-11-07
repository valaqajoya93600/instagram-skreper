# API Documentation

This document describes the HTTP API endpoints exposed by the Railway deployment automation service.

---

## Overview

The service is a Node.js HTTP server designed as a placeholder/health check service for Railway deployments. It runs on port `3000` by default (configurable via the `PORT` environment variable) and provides basic health monitoring capabilities.

**Base URL**: Determined by your Railway deployment URL or `http://localhost:3000` for local development.

**Protocol**: HTTP/HTTPS

**Content-Type**: All endpoints return `application/json`

---

## Endpoints

### GET /healthz

Health check endpoint used to verify service availability and operational status.

**Request**

```http
GET /healthz HTTP/1.1
Host: your-service.railway.app
```

**Response**

- **Status Code**: `200 OK`
- **Content-Type**: `application/json`

**Response Body**

```json
{
  "status": "ok",
  "uptimeSeconds": 3456.789,
  "timestamp": "2024-11-07T18:00:00.000Z"
}
```

**Response Fields**

| Field | Type | Description |
| --- | --- | --- |
| `status` | `string` | Service health status. Always returns `"ok"` when service is operational. |
| `uptimeSeconds` | `number` | Number of seconds the service has been running since startup. |
| `timestamp` | `string` | ISO 8601 timestamp of when the health check was performed. |

**Example cURL Request**

```bash
curl -X GET https://your-service.railway.app/healthz
```

**Example Response**

```json
{
  "status": "ok",
  "uptimeSeconds": 1234.567,
  "timestamp": "2024-11-07T18:30:45.123Z"
}
```

**Usage**

This endpoint is used by:
- Railway's health check system
- The automated deployment script (`scripts/deploy.js`) for post-deployment verification
- Load balancers and monitoring systems
- Uptime monitoring services

**Health Check Configuration**

The deployment system polls this endpoint after deployment with configurable parameters defined in `config/deployment.config.json`:

```json
{
  "healthCheck": {
    "name": "API",
    "urlEnv": "API_HEALTHCHECK_URL",
    "expectedStatus": 200,
    "timeoutSeconds": 180,
    "intervalSeconds": 5,
    "requestTimeoutSeconds": 5
  }
}
```

---

### GET / (Root)

Default root endpoint that provides basic service information.

**Request**

```http
GET / HTTP/1.1
Host: your-service.railway.app
```

**Response**

- **Status Code**: `200 OK`
- **Content-Type**: `application/json`

**Response Body**

```json
{
  "message": "Railway deployment automation placeholder service",
  "healthcheck": "/healthz"
}
```

**Response Fields**

| Field | Type | Description |
| --- | --- | --- |
| `message` | `string` | Service description and purpose. |
| `healthcheck` | `string` | Path to the health check endpoint. |

**Example cURL Request**

```bash
curl -X GET https://your-service.railway.app/
```

**Example Response**

```json
{
  "message": "Railway deployment automation placeholder service",
  "healthcheck": "/healthz"
}
```

---

## Error Handling

The service uses standard HTTP status codes:

| Status Code | Description |
| --- | --- |
| `200` | Success - Request completed successfully |
| `404` | Not Found - Endpoint does not exist (catch-all returns root response) |
| `500` | Internal Server Error - Unexpected server error |

Currently, all requests return `200 OK` as the service operates as a simple placeholder. Error handling should be enhanced when implementing real application logic.

---

## Authentication & Authorization

The current implementation does not include authentication or authorization mechanisms. This is a placeholder service designed for deployment automation and health monitoring.

**For Production Applications**: Implement authentication using:
- Bearer tokens (JWT)
- API keys via headers
- OAuth 2.0
- mTLS for service-to-service communication

Store credentials in Railway environment variables and validate them in middleware before processing requests.

---

## Rate Limiting

No rate limiting is currently implemented. For production deployments, consider implementing:

- Request rate limits per IP/client
- Burst protection
- Circuit breakers for dependent services
- Graceful degradation under load

---

## CORS Configuration

The service does not currently configure CORS headers. If you need to support cross-origin requests from browser-based clients, add CORS middleware:

```javascript
res.writeHead(200, {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
});
```

---

## Extending the API

To add new endpoints to the service, modify `src/index.js`:

```javascript
const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);

  // Add your custom endpoints here
  if (requestUrl.pathname === '/api/v1/your-endpoint') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: 'your response' }));
    return;
  }

  // Existing /healthz endpoint...
});
```

### Best Practices for API Extensions

1. **Versioning**: Use `/api/v1/` prefix for all application endpoints
2. **Request Validation**: Validate all input data before processing
3. **Error Responses**: Return consistent error structures:
   ```json
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid request parameters",
       "details": { ... }
     }
   }
   ```
4. **Logging**: Log all requests with timestamp, method, path, status, and duration
5. **Security Headers**: Add security headers (CSP, HSTS, X-Frame-Options, etc.)

---

## Environment Configuration

| Variable | Default | Description |
| --- | --- | --- |
| `PORT` | `3000` | HTTP server listening port |
| `NODE_ENV` | (none) | Environment mode (`development`, `production`) |

Set these in Railway's environment variables or in your local `.env` file.

---

## Testing the API

### Local Testing

```bash
# Start the server
npm start

# Test health endpoint
curl http://localhost:3000/healthz

# Test root endpoint
curl http://localhost:3000/
```

### Production Testing

```bash
# Set your Railway service URL
export API_URL="https://your-service.railway.app"

# Health check
curl $API_URL/healthz

# Monitor response time
curl -w "\nTime: %{time_total}s\n" -o /dev/null -s $API_URL/healthz
```

### Automated Health Checks

The deployment script automatically verifies health after deployment:

```bash
npm run deploy
```

The script will:
1. Deploy the service to Railway
2. Wait for the deployment to complete
3. Poll the `/healthz` endpoint until it returns `200 OK`
4. Fail the deployment if health check times out (default: 180 seconds)

---

## Monitoring & Observability

### Health Check Monitoring

Configure external monitoring services to poll the `/healthz` endpoint:

- **Uptime monitoring**: UptimeRobot, Pingdom, StatusCake
- **APM**: Datadog, New Relic, AppDynamics
- **Infrastructure**: Railway's built-in monitoring

### Logging

The service logs startup messages to stdout:

```
HTTP server listening on port 3000
```

For production, enhance logging to include:
- Request/response logs
- Error traces with stack traces
- Performance metrics (response times, request counts)
- Health check results

Stream logs using the Railway CLI:

```bash
npx @railway/cli logs --service web --environment production
```

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture and component design
- [SETUP.md](./SETUP.md) - Local development and deployment setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Railway deployment guide
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Operational best practices

---

## Support & Troubleshooting

### Common Issues

**Health Check Fails During Deployment**

- Verify the `PORT` environment variable matches Railway's expectation
- Check that the service is listening on `0.0.0.0` not just `localhost`
- Review service logs: `npx @railway/cli logs --service web`
- Ensure the health check URL is publicly accessible

**Service Returns 404**

- All undefined routes return the root response with `200 OK`
- Verify the request path matches defined endpoints

**Slow Response Times**

- Check Railway service metrics for resource constraints
- Review autoscaling configuration in `config/deployment.config.json`
- Consider increasing CPU/memory allocation

For additional support, see [CONTRIBUTING.md](./CONTRIBUTING.md) for how to report issues.
