# Troubleshooting Guide

## Common Issues
- API 5xx: Check API logs in Kibana and /health endpoint.
- Database connection errors: Verify env vars and service availability.
- Websocket disconnects: Check Redis and Socket.IO adapter.

## Tools
- Prometheus/Grafana for metrics
- Kibana for logs
- Jaeger for traces
