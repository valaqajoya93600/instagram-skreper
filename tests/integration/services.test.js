'use strict';

const { Client } = require('pg');
const { createClient } = require('redis');

describe('Infrastructure services', () => {
  function assertEnv(name) {
    if (!process.env[name]) {
      throw new Error(`Missing environment variable: ${name}`);
    }
  }

  test('Postgres responds to queries', async () => {
    assertEnv('DATABASE_URL');

    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    try {
      const result = await client.query('SELECT 1 AS result');
      expect(result.rows[0].result).toBe(1);
    } finally {
      await client.end();
    }
  });

  test('Redis responds to PING', async () => {
    assertEnv('REDIS_URL');

    const client = createClient({
      url: process.env.REDIS_URL,
    });

    // Avoid unhandled errors in Redis client during teardown.
    client.on('error', () => {});

    await client.connect();
    try {
      const response = await client.ping();
      expect(response).toBe('PONG');
    } finally {
      await client.quit();
    }
  });
});
