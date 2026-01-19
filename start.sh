#!/bin/sh

set -e

echo "🚀 Starting Nexsa API (NODE_ENV=${NODE_ENV})..."

if [ "$NODE_ENV" = "production" ]; then
  npm run start:prod
else
  npm run start:dev
fi