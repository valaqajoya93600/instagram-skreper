'use strict';

const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000',
  },
  webServer: {
    command: 'node src/index.js',
    port: Number.parseInt(process.env.PORT || '3000', 10),
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      PORT: process.env.PORT || '3000',
    },
  },
});
