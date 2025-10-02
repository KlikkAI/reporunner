# Kubernetes Deployment Guide

This guide explains how to deploy Reporunner to Kubernetes using the provided Helm chart.

## Prerequisites
- Kubernetes 1.27+
- Helm 3.12+
- kubectl configured for your cluster

## Install
```bash
# From workspace root
helm upgrade --install reporunner infrastructure/kubernetes/helm \
  --namespace reporunner --create-namespace \
  -f infrastructure/kubernetes/helm/values.yaml
```

## Customize Values
Edit `infrastructure/kubernetes/helm/values.yaml` to configure:
- image repository and tags
- resources and autoscaling
- ingress hostnames and TLS
- database connection strings

## Verify
- `kubectl get pods -n reporunner`
- Visit the frontend Ingress
- API health: `/health`

## Upgrades
```bash
helm upgrade reporunner infrastructure/kubernetes/helm -n reporunner
```
