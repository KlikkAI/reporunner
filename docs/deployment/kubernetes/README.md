# Kubernetes Deployment Guide

This guide explains how to deploy KlikkFlow to Kubernetes using the provided Helm chart.

## Prerequisites
- Kubernetes 1.27+
- Helm 3.12+
- kubectl configured for your cluster

## Install
```bash
# From workspace root
helm upgrade --install klikkflow infrastructure/kubernetes/helm \
  --namespace klikkflow --create-namespace \
  -f infrastructure/kubernetes/helm/values.yaml
```

## Customize Values
Edit `infrastructure/kubernetes/helm/values.yaml` to configure:
- image repository and tags
- resources and autoscaling
- ingress hostnames and TLS
- database connection strings

## Verify
- `kubectl get pods -n klikkflow`
- Visit the frontend Ingress
- API health: `/health`

## Upgrades
```bash
helm upgrade klikkflow infrastructure/kubernetes/helm -n klikkflow
```
