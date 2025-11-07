#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const http = require('node:http');
const https = require('node:https');
const { URL } = require('node:url');

const projectRoot = path.join(__dirname, '..');
const configPath = path.join(projectRoot, 'config', 'deployment.config.json');

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing configuration file: ${filePath}`);
  }

  const fileContents = fs.readFileSync(filePath, 'utf8');

  try {
    return JSON.parse(fileContents);
  } catch (error) {
    throw new Error(`Unable to parse ${filePath}: ${error.message}`);
  }
}

function parseArgs(argv) {
  return argv.reduce(
    (acc, arg) => {
      switch (arg) {
        case '--dry-run':
          acc.dryRun = true;
          break;
        case '--skip-migrations':
          acc.skipMigrations = true;
          break;
        case '--skip-health-checks':
          acc.skipHealthChecks = true;
          break;
        default:
          acc.extraArgs.push(arg);
      }
      return acc;
    },
    {
      dryRun: false,
      skipMigrations: false,
      skipHealthChecks: false,
      extraArgs: [],
    }
  );
}

function applyEnvFromFile(relativePath) {
  const filePath = path.join(projectRoot, relativePath);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const [rawKey, ...rawValueParts] = line.split('=');
      if (!rawKey || rawValueParts.length === 0) {
        return;
      }

      const key = rawKey.trim();
      const value = rawValueParts.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');

      if (!process.env[key]) {
        process.env[key] = value;
      }
    });
}

function assertEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function runCommand(command, args, options = {}) {
  const spawnOptions = {
    stdio: 'inherit',
    env: process.env,
    ...options,
  };

  const result = spawnSync(command, args, spawnOptions);

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with status code ${result.status}`);
  }
}

function requestStatus(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const transport = parsed.protocol === 'https:' ? https : http;

    const request = transport.request(
      {
        ...parsed,
        method: 'GET',
        timeout: timeoutMs,
      },
      (response) => {
        // Drain the response to avoid socket hangs.
        response.resume();
        resolve(response.statusCode || 0);
      }
    );

    request.on('timeout', () => {
      request.destroy(new Error('Request timed out'));
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureHealthy(serviceName, healthConfig) {
  const {
    name: displayName = serviceName,
    url,
    urlEnv,
    expectedStatus = 200,
    timeoutSeconds = 180,
    intervalSeconds = 5,
    requestTimeoutSeconds = 5,
  } = healthConfig;

  const endpoint = url || (urlEnv ? process.env[urlEnv] : undefined);

  if (!endpoint) {
    console.warn(`Skipping health check for ${displayName}: no URL provided.`);
    return;
  }

  const deadline = Date.now() + timeoutSeconds * 1000;
  const requestTimeoutMs = requestTimeoutSeconds * 1000;

  while (Date.now() <= deadline) {
    try {
      const status = await requestStatus(endpoint, requestTimeoutMs);
      if (status === expectedStatus) {
        console.log(`✅ ${displayName} healthy at ${endpoint}`);
        return;
      }

      console.warn(
        `Health check for ${displayName} returned status ${status}. Expected ${expectedStatus}. Retrying in ${intervalSeconds}s...`
      );
    } catch (error) {
      console.warn(
        `Health check for ${displayName} failed: ${error.message}. Retrying in ${intervalSeconds}s...`
      );
    }

    await delay(intervalSeconds * 1000);
  }

  throw new Error(`Health check timed out for ${displayName} (${endpoint})`);
}

function logStep(message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
}

function describeAutoscale(serviceName, autoscaleConfig) {
  if (!autoscaleConfig) {
    return;
  }

  const {
    minReplicas,
    maxReplicas,
    cpuTargetPercentage,
    memoryMiB,
  } = autoscaleConfig;

  const parts = [];
  if (typeof minReplicas === 'number') {
    parts.push(`--min ${minReplicas}`);
  }
  if (typeof maxReplicas === 'number') {
    parts.push(`--max ${maxReplicas}`);
  }
  if (typeof cpuTargetPercentage === 'number') {
    parts.push(`--cpu ${cpuTargetPercentage}`);
  }
  if (typeof memoryMiB === 'number') {
    parts.push(`--memory ${memoryMiB}`);
  }

  if (!parts.length) {
    return;
  }

  console.log(
    `Suggested autoscaling command for ${serviceName}: npx @railway/cli scale ${serviceName} ${parts.join(' ')}`
  );
}

async function main() {
  const config = readJson(configPath);
  const options = parseArgs(process.argv.slice(2));

  const envFiles = Array.isArray(config.envFiles) ? config.envFiles : [];
  envFiles.forEach(applyEnvFromFile);

  const environment = process.env.RAILWAY_ENVIRONMENT || config.environment;

  if (!environment) {
    throw new Error('Unable to determine Railway environment. Set RAILWAY_ENVIRONMENT or define "environment" in config/deployment.config.json');
  }

  if (!options.dryRun) {
    assertEnv('RAILWAY_TOKEN');
  }

  const services = Array.isArray(config.services) ? config.services : [];

  if (!services.length) {
    console.warn('No services defined in deployment configuration.');
  }

  if (options.dryRun) {
    console.log('Running in dry-run mode. No changes will be applied.');
  }

  for (const service of services) {
    const { name, deploy = true } = service;
    if (!name) {
      console.warn('Skipping service entry without a name.');
      continue;
    }

    if (deploy === false) {
      console.log(`Skipping deployment for service ${name} (deploy=false).`);
      continue;
    }

    const cliArgs = ['--yes', '@railway/cli', 'up', '--ci', '--service', name, '--environment', environment];

    logStep(`Deploying service ${name} to environment ${environment}`);
    if (options.dryRun) {
      console.log(`DRY RUN: npx ${cliArgs.join(' ')}`);
    } else {
      runCommand('npx', cliArgs);
    }

    describeAutoscale(name, service.autoscale);
  }

  if (!options.skipMigrations) {
    for (const service of services) {
      const {
        name,
        migrateCommand,
      } = service;

      if (!name || !migrateCommand) {
        continue;
      }

      const migrateArgs = Array.isArray(migrateCommand)
        ? migrateCommand
        : String(migrateCommand).split(' ').filter(Boolean);

      if (!migrateArgs.length) {
        continue;
      }

      const cliArgs = ['--yes', '@railway/cli', 'run', '--environment', environment, '--service', name, ...migrateArgs];
      logStep(`Running migrations for service ${name}: ${migrateArgs.join(' ')}`);

      if (options.dryRun) {
        console.log(`DRY RUN: npx ${cliArgs.join(' ')}`);
      } else {
        runCommand('npx', cliArgs);
      }
    }
  } else {
    console.log('Skipping migrations (per --skip-migrations flag).');
  }

  if (!options.skipHealthChecks) {
    for (const service of services) {
      const { name, healthCheck } = service;
      if (!healthCheck) {
        continue;
      }

      logStep(`Running health check for ${healthCheck.name || name}`);
      if (options.dryRun) {
        const url = healthCheck.url || (healthCheck.urlEnv ? process.env[healthCheck.urlEnv] : undefined);
        console.log(
          `DRY RUN: would verify ${healthCheck.name || name} health at ${url ? url : '[missing URL]'}`
        );
        continue;
      }

      await ensureHealthy(name, healthCheck);
    }
  } else {
    console.log('Skipping health checks (per --skip-health-checks flag).');
  }

  logStep('Deployment workflow completed successfully.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
