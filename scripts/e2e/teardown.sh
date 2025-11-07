#!/bin/bash

set -e

echo "🧹 Tearing down E2E test environment..."

echo "🐳 Stopping Docker services..."
docker-compose down -v

echo "📁 Cleaning up test artifacts..."
rm -rf test-results/
rm -rf playwright-report/

echo "✅ E2E test environment cleaned up!"
