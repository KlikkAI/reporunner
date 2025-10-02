# Monitoring Operations Guide

This guide covers running and using the Prometheus + Grafana stack.

## Start Monitoring Stack
See `infrastructure/monitoring/docker-compose.monitoring.yml`.

## Dashboards
- Import dashboards from `infrastructure/monitoring/grafana/dashboard-configs/`.

## Alerts
- Prometheus rules in `infrastructure/monitoring/prometheus/alerts/`.
- Alertmanager configuration in `infrastructure/monitoring/alertmanager/`.
