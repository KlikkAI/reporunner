# KlikkFlow Helm Chart

This Helm chart deploys KlikkFlow, a visual workflow automation platform, on a Kubernetes cluster.

## Prerequisites

- Kubernetes 1.20+
- Helm 3.8+
- PV provisioner support in the underlying infrastructure
- Ingress controller (nginx recommended)
- Prometheus operator (optional, for monitoring)

## Installing the Chart

To install the chart with the release name `klikkflow`:

```bash
helm repo add bitnami https://charts.bitnami.com/bitnami
helm dependency update
helm install klikkflow . --namespace klikkflow --create-namespace
```

The command deploys KlikkFlow on the Kubernetes cluster in the default configuration. The [Parameters](#parameters) section lists the parameters that can be configured during installation.

> **Tip**: List all releases using `helm list`

## Uninstalling the Chart

To uninstall/delete the `klikkflow` deployment:

```bash
helm delete klikkflow --namespace klikkflow
```

The command removes all the Kubernetes components associated with the chart and deletes the release.

## Parameters

### Global parameters

| Name                      | Description                                     | Value |
| ------------------------- | ----------------------------------------------- | ----- |
| `global.imageRegistry`    | Global Docker image registry                    | `""`  |
| `global.imagePullSecrets` | Global Docker registry secret names as an array| `[]`  |
| `global.storageClass`     | Global StorageClass for Persistent Volume(s)   | `""`  |

### KlikkFlow Image parameters

| Name                                | Description                                        | Value                    |
| ----------------------------------- | -------------------------------------------------- | ------------------------ |
| `klikkflow.image.registry`         | KlikkFlow image registry                          | `docker.io`             |
| `klikkflow.image.repository`       | KlikkFlow image repository                        | `klikkflow/klikkflow`  |
| `klikkflow.image.tag`              | KlikkFlow image tag                               | `1.0.0`                  |
| `klikkflow.image.pullPolicy`       | KlikkFlow image pull policy                       | `IfNotPresent`           |
| `klikkflow.image.pullSecrets`      | KlikkFlow image pull secrets                      | `[]`                     |

### Backend parameters

| Name                                      | Description                                    | Value      |
| ----------------------------------------- | ---------------------------------------------- | ---------- |
| `klikkflow.backend.replicaCount`         | Number of backend replicas to deploy          | `3`        |
| `klikkflow.backend.image.repository`     | Backend image repository                       | `klikkflow/backend` |
| `klikkflow.backend.image.tag`            | Backend image tag                              | `1.0.0`    |
| `klikkflow.backend.resources.limits`     | The resources limits for the backend containers    | `{}`       |
| `klikkflow.backend.resources.requests`   | The requested resources for the backend containers | `{}`       |
| `klikkflow.backend.autoscaling.enabled`  | Enable autoscaling for backend                | `true`     |
| `klikkflow.backend.autoscaling.minReplicas` | Minimum number of backend replicas         | `2`        |
| `klikkflow.backend.autoscaling.maxReplicas` | Maximum number of backend replicas         | `10`       |
| `klikkflow.backend.autoscaling.targetCPUUtilizationPercentage` | Target CPU utilization percentage | `70` |

### Frontend parameters

| Name                                      | Description                                    | Value      |
| ----------------------------------------- | ---------------------------------------------- | ---------- |
| `klikkflow.frontend.replicaCount`        | Number of frontend replicas to deploy         | `2`        |
| `klikkflow.frontend.image.repository`    | Frontend image repository                      | `klikkflow/frontend` |
| `klikkflow.frontend.image.tag`           | Frontend image tag                             | `1.0.0`    |
| `klikkflow.frontend.resources.limits`    | The resources limits for the frontend containers   | `{}`       |
| `klikkflow.frontend.resources.requests`  | The requested resources for the frontend containers| `{}`       |
| `klikkflow.frontend.autoscaling.enabled` | Enable autoscaling for frontend               | `true`     |
| `klikkflow.frontend.autoscaling.minReplicas` | Minimum number of frontend replicas       | `2`        |
| `klikkflow.frontend.autoscaling.maxReplicas` | Maximum number of frontend replicas       | `5`        |

### Worker parameters

| Name                                      | Description                                    | Value      |
| ----------------------------------------- | ---------------------------------------------- | ---------- |
| `klikkflow.worker.replicaCount`          | Number of worker replicas to deploy           | `3`        |
| `klikkflow.worker.image.repository`      | Worker image repository                        | `klikkflow/worker` |
| `klikkflow.worker.image.tag`             | Worker image tag                               | `1.0.0`    |
| `klikkflow.worker.resources.limits`      | The resources limits for the worker containers     | `{}`       |
| `klikkflow.worker.resources.requests`    | The requested resources for the worker containers  | `{}`       |
| `klikkflow.worker.autoscaling.enabled`   | Enable autoscaling for worker                 | `true`     |
| `klikkflow.worker.autoscaling.minReplicas` | Minimum number of worker replicas           | `2`        |
| `klikkflow.worker.autoscaling.maxReplicas` | Maximum number of worker replicas           | `20`       |
| `klikkflow.worker.concurrency`           | Worker concurrency level                       | `10`       |

### PostgreSQL parameters

| Name                        | Description                                       | Value           |
| --------------------------- | ------------------------------------------------- | --------------- |
| `postgresql.enabled`        | Switch to enable or disable the PostgreSQL helm chart | `true`      |
| `postgresql.auth.username`  | Name for a custom user to create                 | `klikkflow`    |
| `postgresql.auth.password`  | Password for the custom user to create           | `klikkflow-password` |
| `postgresql.auth.database`  | Name for a custom database to create             | `klikkflow`    |

### MongoDB parameters

| Name                     | Description                                       | Value           |
| ------------------------ | ------------------------------------------------- | --------------- |
| `mongodb.enabled`        | Switch to enable or disable the MongoDB helm chart | `true`        |
| `mongodb.auth.username`  | MongoDB custom user                               | `klikkflow`    |
| `mongodb.auth.password`  | MongoDB custom user password                      | `klikkflow-password` |
| `mongodb.auth.database`  | MongoDB custom database                           | `klikkflow`    |

### Redis parameters

| Name                     | Description                                       | Value           |
| ------------------------ | ------------------------------------------------- | --------------- |
| `redis.enabled`          | Switch to enable or disable the Redis helm chart | `true`          |
| `redis.auth.enabled`     | Enable password authentication                    | `true`          |
| `redis.auth.password`    | Redis password                                    | `redis-password` |

### Ingress parameters

| Name                       | Description                                       | Value           |
| -------------------------- | ------------------------------------------------- | --------------- |
| `ingress.enabled`          | Enable ingress record generation for KlikkFlow  | `true`          |
| `ingress.className`        | IngressClass that will be used to implement the Ingress | `nginx`   |
| `ingress.annotations`      | Additional annotations for the Ingress resource  | `{}`            |
| `ingress.hosts`            | An array with hosts and paths                     | `[]`            |
| `ingress.tls`              | TLS configuration for the hosts                  | `[]`            |

### Monitoring parameters

| Name                                  | Description                                  | Value    |
| ------------------------------------- | -------------------------------------------- | -------- |
| `monitoring.enabled`                  | Enable monitoring with Prometheus           | `true`   |
| `monitoring.serviceMonitor.enabled`   | Enable ServiceMonitor for Prometheus        | `true`   |
| `monitoring.serviceMonitor.interval`  | Scrape interval for ServiceMonitor          | `30s`    |
| `monitoring.prometheusRule.enabled`   | Enable PrometheusRule for alerting          | `true`   |

### Persistence parameters

| Name                           | Description                                  | Value         |
| ------------------------------ | -------------------------------------------- | ------------- |
| `persistence.logs.enabled`     | Enable persistence for logs                 | `true`        |
| `persistence.logs.size`        | Size of the logs PVC                        | `10Gi`        |
| `persistence.logs.accessMode`  | Access mode of the logs PVC                 | `ReadWriteMany` |
| `persistence.uploads.enabled`  | Enable persistence for uploads              | `true`        |
| `persistence.uploads.size`     | Size of the uploads PVC                     | `50Gi`        |

### Backup parameters

| Name                              | Description                                  | Value         |
| --------------------------------- | -------------------------------------------- | ------------- |
| `backup.enabled`                  | Enable backup CronJob                       | `true`        |
| `backup.schedule`                 | Backup schedule (cron format)               | `0 2 * * *`   |
| `backup.retention`                | Backup retention period                     | `30d`         |
| `backup.storage.type`             | Backup storage type                          | `s3`          |
| `backup.storage.bucket`           | S3 bucket for backups                       | `klikkflow-backups` |

## Configuration and installation details

### Setting up Ingress

This chart provides support for Ingress resources. If you have an ingress controller installed on your cluster, such as nginx-ingress or HAProxy Ingress, you can create an Ingress resource to route traffic to KlikkFlow. To enable Ingress integration, set `ingress.enabled` to `true`.

### TLS secrets

The chart also facilitates the creation of TLS secrets for use with the Ingress controller. To enable TLS, set the `ingress.tls` parameter.

### Setting Pod's affinity

This chart allows you to set your custom affinity using the `affinity` parameter. Learn more about Pod's affinity in the [kubernetes documentation](https://kubernetes.io/docs/concepts/configuration/assign-pod-node/#affinity-and-anti-affinity).

### Deploying extra resources

There are cases where you may want to deploy extra objects, such as KongPlugins, RBAC, etc. For covering this case, the chart allows adding the full specification of other objects using the `extraDeploy` parameter.

## Troubleshooting

Find more information about how to deal with common errors related to Bitnami's Helm charts in [this troubleshooting guide](https://docs.bitnami.com/general/how-to/troubleshoot-helm-chart-issues).

## Upgrading

### To 1.1.0

This version introduces the following changes:

- Updated to use latest PostgreSQL and MongoDB versions
- Added comprehensive monitoring and alerting
- Enhanced security with network policies
- Improved backup and disaster recovery

## Notable changes

### 1.0.0

This is the first major version of the chart. It includes:

- Complete Kubernetes deployment for KlikkFlow
- PostgreSQL with pgvector for AI capabilities
- MongoDB for primary data storage
- Redis for caching and session management
- Comprehensive monitoring and alerting
- Automated backups and disaster recovery
- Enterprise-grade security features