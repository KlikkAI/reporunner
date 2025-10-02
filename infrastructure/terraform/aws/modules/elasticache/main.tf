/**
 * ElastiCache Redis Module
 * Creates Redis cluster for caching and session storage
 */

# Random auth token for Redis
resource "random_password" "auth_token" {
  length  = 32
  special = false # Redis auth tokens can't contain special characters
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "${var.name_prefix}-redis-subnet-group"
  subnet_ids = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-redis-subnet-group"
    }
  )
}

# ElastiCache Parameter Group
resource "aws_elasticache_parameter_group" "main" {
  name_prefix = "${var.name_prefix}-redis-"
  family      = "redis7"
  description = "Redis parameter group"

  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }

  parameter {
    name  = "timeout"
    value = "300"
  }

  parameter {
    name  = "tcp-keepalive"
    value = "300"
  }

  parameter {
    name  = "notify-keyspace-events"
    value = "Ex"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-redis-parameter-group"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# ElastiCache Replication Group (Redis Cluster)
resource "aws_elasticache_replication_group" "main" {
  replication_group_id       = "${var.name_prefix}-redis"
  replication_group_description = "Redis cluster for caching and sessions"
  engine                     = "redis"
  engine_version             = "7.0"
  node_type                  = var.node_type
  num_cache_clusters         = var.num_cache_nodes
  parameter_group_name       = aws_elasticache_parameter_group.main.name
  subnet_group_name          = aws_elasticache_subnet_group.main.name
  security_group_ids         = [var.security_group_id]

  # Authentication
  auth_token                 = random_password.auth_token.result
  transit_encryption_enabled = true
  at_rest_encryption_enabled = true
  kms_key_id                = var.kms_key_id

  # High Availability
  automatic_failover_enabled = var.num_cache_nodes > 1
  multi_az_enabled          = var.num_cache_nodes > 1

  # Maintenance
  maintenance_window = "mon:04:00-mon:05:00"

  # Snapshot Configuration
  snapshot_retention_limit = var.snapshot_retention_limit
  snapshot_window         = "03:00-04:00"

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  # Apply changes immediately in non-production
  apply_immediately = var.environment != "production"

  # CloudWatch Logs
  log_delivery_configuration {
    destination      = var.cloudwatch_log_group_name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "slow-log"
  }

  log_delivery_configuration {
    destination      = var.cloudwatch_log_group_name
    destination_type = "cloudwatch-logs"
    log_format       = "json"
    log_type         = "engine-log"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-redis"
    }
  )
}

# Store Redis credentials in Secrets Manager
resource "aws_secretsmanager_secret" "redis_credentials" {
  name_prefix             = "${var.name_prefix}-redis-credentials-"
  description             = "ElastiCache Redis credentials"
  recovery_window_in_days = 7

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-redis-credentials"
    }
  )
}

resource "aws_secretsmanager_secret_version" "redis_credentials" {
  secret_id = aws_secretsmanager_secret.redis_credentials.id
  secret_string = jsonencode({
    auth_token              = random_password.auth_token.result
    engine                  = "redis"
    primary_endpoint        = aws_elasticache_replication_group.main.primary_endpoint_address
    reader_endpoint         = aws_elasticache_replication_group.main.reader_endpoint_address
    port                    = aws_elasticache_replication_group.main.port
    replication_group_id    = aws_elasticache_replication_group.main.id
  })
}
