'use strict';

// Global test setup
const { setupDatabase, teardownDatabase } = require('./helpers/database');
const { setupMocks, teardownMocks } = require('./helpers/mocks');
const { initializeDatabase } = require('../src/config/database');

// Setup in-memory database and mocks before all tests
beforeAll(async () => {
  // Initialize database for all tests
  await initializeDatabase();
  await setupDatabase();
  setupMocks();
});

// Clean up database between tests
afterEach(async () => {
  await teardownDatabase();
});

// Clean up mocks after all tests
afterAll(async () => {
  teardownMocks();
});

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.REDIS_URL = 'redis://localhost:6379/1';