#!/usr/bin/env node
'use strict';

const { URL } = require('node:url');

function sanitizeConnectionString(connectionString) {
  try {
    const parsed = new URL(connectionString);
    if (parsed.password) {
      parsed.password = '***';
    }
    return parsed.toString();
  } catch (error) {
    return '***';
  }
}

function assertEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function main() {
  const databaseUrl = assertEnv('DATABASE_URL');
  const sanitizedUrl = sanitizeConnectionString(databaseUrl);

  console.log('Running database migrations using connection: %s', sanitizedUrl);
  console.log(
    'No migration engine has been configured yet. Add your migration runner and update scripts/migrate.js accordingly.'
  );
  console.log('Migration step completed (no-op).');
}

main();
