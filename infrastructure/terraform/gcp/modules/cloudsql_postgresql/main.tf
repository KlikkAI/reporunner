# Cloud SQL PostgreSQL Module

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "postgresql" {
  name             = "${var.name_prefix}-postgresql"
  database_version = var.database_version
  region           = var.region
  project          = var.project_id

  settings {
    tier              = var.tier
    availability_type = var.high_availability ? "REGIONAL" : "ZONAL"
    disk_size         = var.disk_size_gb
    disk_type         = var.disk_type
    disk_autoresize   = var.disk_autoresize

    # Backup configuration
    backup_configuration {
      enabled                        = true
      start_time                     = var.backup_start_time
      point_in_time_recovery_enabled = var.point_in_time_recovery
      transaction_log_retention_days = var.transaction_log_retention_days
      backup_retention_settings {
        retained_backups = var.backup_retention_count
        retention_unit   = "COUNT"
      }
    }

    # IP configuration
    ip_configuration {
      ipv4_enabled    = var.enable_public_ip
      private_network = var.private_network_self_link
      require_ssl     = true

      dynamic "authorized_networks" {
        for_each = var.authorized_networks
        content {
          name  = authorized_networks.value.name
          value = authorized_networks.value.cidr
        }
      }
    }

    # Maintenance window
    maintenance_window {
      day          = var.maintenance_window_day
      hour         = var.maintenance_window_hour
      update_track = var.maintenance_update_track
    }

    # Database flags
    dynamic "database_flags" {
      for_each = merge(
        var.database_flags,
        {
          # Enable pgvector extension
          "cloudsql.enable_pgvector" = "on"
          # Performance tuning
          "max_connections"          = tostring(var.max_connections)
          "shared_buffers"           = var.shared_buffers
          "effective_cache_size"     = var.effective_cache_size
          "work_mem"                 = var.work_mem
        }
      )
      content {
        name  = database_flags.key
        value = database_flags.value
      }
    }

    # Insights configuration
    insights_config {
      query_insights_enabled  = var.enable_query_insights
      query_string_length     = 1024
      record_application_tags = true
      record_client_address   = true
    }

    user_labels = var.labels
  }

  deletion_protection = var.deletion_protection

  depends_on = [var.private_vpc_connection]
}

# Database
resource "google_sql_database" "reporunner" {
  name     = var.database_name
  instance = google_sql_database_instance.postgresql.name
  project  = var.project_id
}

# Database user
resource "google_sql_user" "reporunner" {
  name     = var.database_user
  instance = google_sql_database_instance.postgresql.name
  password = random_password.db_password.result
  project  = var.project_id
}

# Read replica (optional)
resource "google_sql_database_instance" "read_replica" {
  count = var.create_read_replica ? 1 : 0

  name                 = "${var.name_prefix}-postgresql-replica"
  database_version     = var.database_version
  region               = var.replica_region != "" ? var.replica_region : var.region
  project              = var.project_id
  master_instance_name = google_sql_database_instance.postgresql.name

  replica_configuration {
    failover_target = false
  }

  settings {
    tier              = var.replica_tier != "" ? var.replica_tier : var.tier
    availability_type = "ZONAL"
    disk_size         = var.disk_size_gb
    disk_type         = var.disk_type
    disk_autoresize   = var.disk_autoresize

    ip_configuration {
      ipv4_enabled    = var.enable_public_ip
      private_network = var.private_network_self_link
      require_ssl     = true
    }

    user_labels = var.labels
  }

  deletion_protection = var.deletion_protection
}

# Store password in Secret Manager
resource "google_secret_manager_secret" "db_password" {
  secret_id = "${var.name_prefix}-postgresql-password"
  project   = var.project_id

  replication {
    automatic = true
  }

  labels = var.labels
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db_password.result
}
