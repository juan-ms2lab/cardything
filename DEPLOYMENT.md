# Cardything - Production Deployment Guide

This guide covers deploying Cardything on the MS2 Labs infrastructure using **systemd** (native deployment).

## Overview

Cardything runs natively via systemd (not Docker) for faster iteration and simpler debugging.

| Item | Value |
|------|-------|
| **Live URL** | https://cardything.ms2-lab.com |
| **Port** | 3011 |
| **Service** | `cardything.service` |
| **Database** | PostgreSQL (cardything_prod via Docker) |
| **Auth** | Autentico (centralized auth service) |

## Prerequisites

- Node.js 18+ installed on host
- PostgreSQL running (Docker container)
- Autentico running on port 3041
- Nginx Proxy Manager routing `cardything.ms2-lab.com` → `127.0.0.1:3011`

## Deployment Steps

### 1. Initial Setup

```bash
cd /srv/apps/cardything

# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Build for production (standalone output)
npm run build

# Copy static assets to standalone directory
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
```

### 2. Environment Configuration

Create `/srv/apps/cardything/.env.prod` with:

```env
# Database
DATABASE_URL=postgresql://postgres:PASSWORD@localhost:5432/cardything_prod

# NextAuth
NEXTAUTH_URL=https://cardything.ms2-lab.com
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Autentico (centralized auth)
AUTENTICO_URL=http://localhost:3041
```

### 3. Systemd Service

The service file is at `/etc/systemd/system/cardything.service`:

```ini
[Unit]
Description=Cardything Kanban App
After=network.target

[Service]
Type=simple
User=apps
Group=apps
WorkingDirectory=/srv/apps/cardything/.next/standalone
EnvironmentFile=/srv/apps/cardything/.env.prod
ExecStart=/usr/bin/node server.js
Restart=on-failure
RestartSec=3
Environment=NODE_ENV=production
Environment=PORT=3011
Environment=HOSTNAME=0.0.0.0

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cardything
sudo systemctl start cardything
```

## Common Operations

### Service Management

```bash
# Check status
sudo systemctl status cardything

# View logs
sudo journalctl -u cardything -f

# Restart
sudo systemctl restart cardything

# Stop
sudo systemctl stop cardything
```

### Deploy Code Changes

```bash
cd /srv/apps/cardything

# Pull latest code (if using git)
git pull

# Rebuild
npm run build

# Copy static assets
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/

# Restart service
sudo systemctl restart cardything
```

### Database Operations

```bash
# Connect to database
docker exec -it postgres psql -U postgres -d cardything_prod

# Push schema changes
npx prisma db push

# Open Prisma Studio (development)
npx prisma studio
```

## Nginx Proxy Manager Configuration

In NPM (port 81), create a proxy host:

- **Domain**: `cardything.ms2-lab.com`
- **Forward Hostname/IP**: `127.0.0.1`
- **Forward Port**: `3011`
- **SSL**: Let's Encrypt
- **Force SSL**: Yes
- **Websockets Support**: Yes (for hot-reload if needed)

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u cardything --no-pager -n 50

# Check if port is in use
lsof -i :3011

# Test manual start
cd /srv/apps/cardything/.next/standalone
source /srv/apps/cardything/.env.prod
NODE_ENV=production PORT=3011 HOSTNAME=0.0.0.0 node server.js
```

### Database Connection Issues

- Verify PostgreSQL container is running: `docker ps | grep postgres`
- Check DATABASE_URL uses `localhost` not `postgres` (not in Docker network)
- Test connection: `psql -h localhost -U postgres -d cardything_prod`

### Authentication Issues

- Verify Autentico is running: `curl http://localhost:3041/health`
- Check AUTENTICO_URL in .env.prod
- Ensure NEXTAUTH_URL uses the public domain

## File Locations

| File | Purpose |
|------|---------|
| `/srv/apps/cardything/.env.prod` | Production environment variables |
| `/srv/apps/cardything/.next/standalone/` | Production build output |
| `/etc/systemd/system/cardything.service` | Systemd service file |
| `/srv/apps/cardything/start.sh` | Optional start script |

## Backup

Database backup:
```bash
docker exec postgres pg_dump -U postgres cardything_prod > /srv/backups/postgres/cardything_$(date +%Y%m%d).sql
```
