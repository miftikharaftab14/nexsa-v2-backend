#!/bin/sh

set -e  # Exit on error and show it

echo "Installing dependencies..."
npm install

echo "📦 Running database migrations..."
npm run migration:run

echo "🔍 Checking if seed data exists..."
# Check if categories exist in the database
if npm run seed:check; then
  echo "✅ Seed data already exists. Skipping seeds."
else
  echo "🌱 No seed data found. Running seeds..."
  npm run seed
fi

echo "🚀 Starting NestJS in ${NODE_ENV} mode..."

if [ "$NODE_ENV" = "production" ]; then
  npm run start:prod
else
  npm run start:dev
fi