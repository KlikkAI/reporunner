/**
 * DocumentDB Module
 * Creates MongoDB-compatible DocumentDB cluster
 */

# Random password for DocumentDB master user
resource "random_password" "master" {
  length  = 32
  special = true
}

# DocumentDB Subnet Group
resource "aws_docdb_subnet_group" "main" {
  name_prefix = "${var.name_prefix}-"
  subnet_ids  = var.subnet_ids

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-docdb-subnet-group"
    }
  )
}

# DocumentDB Cluster Parameter Group
resource "aws_docdb_cluster_parameter_group" "main" {
  name_prefix = "${var.name_prefix}-"
  family      = "docdb5.0"
  description = "DocumentDB cluster parameter group"

  parameter {
    name  = "tls"
    value = "enabled"
  }

  parameter {
    name  = "audit_logs"
    value = "enabled"
  }

  parameter {
    name  = "ttl_monitor"
    value = "enabled"
  }

  parameter {
    name  = "profiler"
    value = "enabled"
  }

  parameter {
    name  = "profiler_threshold_ms"
    value = "100"
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-docdb-parameter-group"
    }
  )

  lifecycle {
    create_before_destroy = true
  }
}

# DocumentDB Cluster
resource "aws_docdb_cluster" "main" {
  cluster_identifier      = "${var.name_prefix}-docdb"
  engine                  = "docdb"
  engine_version          = "5.0.0"
  master_username         = var.master_username
  master_password         = random_password.master.result
  db_subnet_group_name    = aws_docdb_subnet_group.main.name
  db_cluster_parameter_group_name = aws_docdb_cluster_parameter_group.main.name
  vpc_security_group_ids  = [var.security_group_id]

  # Backup Configuration
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = "03:00-04:00"
  preferred_maintenance_window = "mon:04:00-mon:05:00"

  # Encryption
  storage_encrypted = true
  kms_key_id       = var.kms_key_id

  # CloudWatch Logs
  enabled_cloudwatch_logs_exports = ["audit", "profiler"]

  # Deletion Protection
  deletion_protection = var.deletion_protection
  skip_final_snapshot = !var.deletion_protection
  final_snapshot_identifier = var.deletion_protection ? "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  # Apply changes immediately in non-production
  apply_immediately = var.environment != "production"

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-docdb"
    }
  )
}

# DocumentDB Cluster Instances
resource "aws_docdb_cluster_instance" "main" {
  count              = var.cluster_size
  identifier         = "${var.name_prefix}-docdb-${count.index + 1}"
  cluster_identifier = aws_docdb_cluster.main.id
  instance_class     = var.instance_class

  # Auto minor version upgrade
  auto_minor_version_upgrade = true

  # Monitoring
  performance_insights_enabled = true
  performance_insights_kms_key_id = var.kms_key_id

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-docdb-${count.index + 1}"
    }
  )
}

# Store DocumentDB credentials in Secrets Manager
resource "aws_secretsmanager_secret" "docdb_credentials" {
  name_prefix             = "${var.name_prefix}-docdb-credentials-"
  description             = "DocumentDB cluster credentials"
  recovery_window_in_days = 7

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-docdb-credentials"
    }
  )
}

resource "aws_secretsmanager_secret_version" "docdb_credentials" {
  secret_id = aws_secretsmanager_secret.docdb_credentials.id
  secret_string = jsonencode({
    username          = var.master_username
    password          = random_password.master.result
    engine            = "docdb"
    host              = aws_docdb_cluster.main.endpoint
    port              = aws_docdb_cluster.main.port
    readerEndpoint    = aws_docdb_cluster.main.reader_endpoint
    clusterIdentifier = aws_docdb_cluster.main.id
  })
}
