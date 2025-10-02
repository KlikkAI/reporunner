# Docker Deployment Guide

This guide explains how to run Reporunner using Docker Compose.

## Prerequisites
- Docker 24+
- Docker Compose v2

## Quick Start (Development)
```bash
# From workspace root
docker compose -f docker-compose.dev.yml up -d
```

## Production
Use the production compose in `infrastructure/docker/docker-compose.prod.yml`.

```bash
# From workspace root
docker compose -f infrastructure/docker/docker-compose.prod.yml up -d
```

## Services
- API: :3001
- Frontend: :3000
- MongoDB, PostgreSQL, Redis, MinIO, etc.

## Environment Variables
Copy `.env.example` to `.env` and set values as needed.

## Health Checks
- API: `http://localhost:3001/health`
- Frontend: `http://localhost:3000`
