# Scaling Guide

## Horizontal Scaling
- Use Kubernetes HPA in `infrastructure/kubernetes/helm/templates/hpa.yaml`.

## Caching & Queues
- Redis for cache and pub/sub.

## Database
- Configure Postgres/Mongo resources and connection pooling.
