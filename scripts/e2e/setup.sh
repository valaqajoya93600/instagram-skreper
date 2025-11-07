#!/bin/bash

set -e

echo "🚀 Setting up E2E test environment..."

echo "📦 Installing dependencies..."
npm ci

echo "🎭 Installing Playwright browsers..."
npm run setup:e2e

echo "🐳 Starting Docker services..."
docker-compose up -d

echo "⏳ Waiting for services to be ready..."

max_attempts=60
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if curl -f http://localhost:3000/healthz > /dev/null 2>&1; then
    echo "✅ Services are ready!"
    break
  fi
  
  attempt=$((attempt + 1))
  echo "   Attempt $attempt/$max_attempts - Waiting for services..."
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Services failed to start within the timeout period"
  docker-compose logs
  exit 1
fi

echo "✅ E2E test environment is ready!"
echo ""
echo "Run tests with:"
echo "  npm run test:e2e"
echo "  npm run test:e2e:ui"
echo "  npm run test:e2e:headed"
