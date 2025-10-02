# Memorystore Redis Module

# Redis instance
resource "google_redis_instance" "redis" {
  name               = "${var.name_prefix}-redis"
  tier               = var.tier
  memory_size_gb     = var.memory_size_gb
  region             = var.region
  project            = var.project_id
  redis_version      = var.redis_version
  display_name       = "${var.name_prefix} Redis Instance"
  reserved_ip_range  = var.reserved_ip_range
  connect_mode       = var.connect_mode
  authorized_network = var.authorized_network

  # High availability (STANDARD_HA tier only)
  replica_count     = var.tier == "STANDARD_HA" ? var.replica_count : null
  read_replicas_mode = var.tier == "STANDARD_HA" ? var.read_replicas_mode : null

  # Redis configuration
  redis_configs = merge(
    var.redis_configs,
    {
      # Performance tuning
      maxmemory-policy = var.maxmemory_policy
      # Persistence
      notify-keyspace-events = var.notify_keyspace_events
    }
  )

  # Maintenance policy
  maintenance_policy {
    weekly_maintenance_window {
      day = var.maintenance_window_day
      start_time {
        hours   = var.maintenance_window_hour
        minutes = 0
        seconds = 0
        nanos   = 0
      }
    }
  }

  # Transit encryption
  transit_encryption_mode = var.transit_encryption_mode
  auth_enabled            = var.auth_enabled

  # Labels
  labels = var.labels

  # Prevent accidental deletion in production
  lifecycle {
    prevent_destroy = var.prevent_destroy
  }
}

# Store Redis auth string in Secret Manager (if auth enabled)
resource "google_secret_manager_secret" "redis_auth" {
  count     = var.auth_enabled ? 1 : 0
  secret_id = "${var.name_prefix}-redis-auth"
  project   = var.project_id

  replication {
    automatic = true
  }

  labels = var.labels
}

resource "google_secret_manager_secret_version" "redis_auth" {
  count       = var.auth_enabled ? 1 : 0
  secret      = google_secret_manager_secret.redis_auth[0].id
  secret_data = google_redis_instance.redis.auth_string
}
