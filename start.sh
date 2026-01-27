#!/bin/sh

set -e

echo "🚀 Starting Nexsa API in Docker (NODE_ENV=${NODE_ENV})..."

# In the Docker image we only have the compiled dist/, not the full Nest
# workspace with tsconfig.json and src/, so we always run the compiled app.
pnpm run start:prod