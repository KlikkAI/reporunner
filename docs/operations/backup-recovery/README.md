# Backup & Recovery Guide

## Backups
- CronJob: `infrastructure/kubernetes/helm/templates/cronjob-backup.yaml`
- Schedules and retention in values.yaml

## Restore
- Use kubectl jobs or scripts to restore from backup storage.
