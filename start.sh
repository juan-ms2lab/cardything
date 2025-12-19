#!/bin/bash
set -e

cd /srv/apps/cardything/.next/standalone

# Load environment variables from parent directory
set -a
source /srv/apps/cardything/.env.prod
set +a

# Export required Next.js variables
export NODE_ENV=production
export PORT=3011
export HOSTNAME=0.0.0.0

# Start the application
exec node server.js
