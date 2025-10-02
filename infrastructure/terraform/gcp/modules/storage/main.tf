# Cloud Storage Module

# Storage bucket for application files
resource "google_storage_bucket" "app_storage" {
  name          = "${var.name_prefix}-app-storage-${var.project_id}"
  location      = var.location_type == "REGION" ? var.region : var.multi_region
  project       = var.project_id
  storage_class = var.storage_class
  force_destroy = var.force_destroy

  # Uniform bucket-level access
  uniform_bucket_level_access {
    enabled = true
  }

  # Versioning
  versioning {
    enabled = var.enable_versioning
  }

  # Lifecycle rules
  dynamic "lifecycle_rule" {
    for_each = var.lifecycle_rules
    content {
      action {
        type          = lifecycle_rule.value.action.type
        storage_class = lookup(lifecycle_rule.value.action, "storage_class", null)
      }
      condition {
        age                   = lookup(lifecycle_rule.value.condition, "age", null)
        created_before        = lookup(lifecycle_rule.value.condition, "created_before", null)
        with_state            = lookup(lifecycle_rule.value.condition, "with_state", null)
        matches_storage_class = lookup(lifecycle_rule.value.condition, "matches_storage_class", null)
        num_newer_versions    = lookup(lifecycle_rule.value.condition, "num_newer_versions", null)
      }
    }
  }

  # CORS configuration
  dynamic "cors" {
    for_each = var.cors_rules
    content {
      origin          = cors.value.origin
      method          = cors.value.method
      response_header = cors.value.response_header
      max_age_seconds = cors.value.max_age_seconds
    }
  }

  # Encryption
  dynamic "encryption" {
    for_each = var.encryption_key != "" ? [1] : []
    content {
      default_kms_key_name = var.encryption_key
    }
  }

  # Logging
  dynamic "logging" {
    for_each = var.enable_logging ? [1] : []
    content {
      log_bucket        = var.log_bucket != "" ? var.log_bucket : google_storage_bucket.logs[0].name
      log_object_prefix = "storage-logs/"
    }
  }

  # Public access prevention
  public_access_prevention = var.public_access_prevention

  # Labels
  labels = var.labels
}

# Logging bucket (if logging enabled and no external bucket provided)
resource "google_storage_bucket" "logs" {
  count = var.enable_logging && var.log_bucket == "" ? 1 : 0

  name          = "${var.name_prefix}-logs-${var.project_id}"
  location      = var.location_type == "REGION" ? var.region : var.multi_region
  project       = var.project_id
  storage_class = "STANDARD"
  force_destroy = var.force_destroy

  uniform_bucket_level_access {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = var.log_retention_days
    }
  }

  public_access_prevention = "enforced"
  labels                   = var.labels
}

# Bucket for workflow artifacts
resource "google_storage_bucket" "artifacts" {
  name          = "${var.name_prefix}-artifacts-${var.project_id}"
  location      = var.location_type == "REGION" ? var.region : var.multi_region
  project       = var.project_id
  storage_class = var.storage_class
  force_destroy = var.force_destroy

  uniform_bucket_level_access {
    enabled = true
  }

  versioning {
    enabled = false
  }

  # Auto-delete old artifacts
  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = var.artifact_retention_days
    }
  }

  public_access_prevention = "enforced"
  labels                   = var.labels
}

# Service account for storage access
resource "google_service_account" "storage_access" {
  account_id   = "${var.name_prefix}-storage"
  display_name = "Storage Access Service Account"
  project      = var.project_id
}

# IAM binding for app storage
resource "google_storage_bucket_iam_member" "app_storage_admin" {
  bucket = google_storage_bucket.app_storage.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.storage_access.email}"
}

# IAM binding for artifacts
resource "google_storage_bucket_iam_member" "artifacts_admin" {
  bucket = google_storage_bucket.artifacts.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.storage_access.email}"
}

# Optional: CDN backend bucket
resource "google_compute_backend_bucket" "cdn" {
  count = var.enable_cdn ? 1 : 0

  name        = "${var.name_prefix}-cdn-backend"
  bucket_name = google_storage_bucket.app_storage.name
  project     = var.project_id

  enable_cdn = true

  cdn_policy {
    cache_mode        = "CACHE_ALL_STATIC"
    client_ttl        = 3600
    default_ttl       = 3600
    max_ttl           = 86400
    negative_caching  = true
    serve_while_stale = 86400
  }
}
