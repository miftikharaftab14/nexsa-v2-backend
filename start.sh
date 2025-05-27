#!/bin/sh

set -e  # Exit on error and show it

echo "Installing dependencies..."
npm install

echo "📦 Running database migrations..."
npm run migration:run

echo "🚀 Starting NestJS in ${NODE_ENV} mode..."

if [ "$NODE_ENV" = "production" ]; then
  npm run start:prod
else
  npm run start:dev
fi