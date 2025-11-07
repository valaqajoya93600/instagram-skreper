'use strict';

const { test, expect } = require('@playwright/test');

test.describe('service availability', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/healthz');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(typeof body.timestamp).toBe('string');
  });

  test('root endpoint advertises health check', async ({ request }) => {
    const response = await request.get('/');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.message).toContain('Railway deployment automation');
    expect(body.healthcheck).toBe('/healthz');
  });
});
