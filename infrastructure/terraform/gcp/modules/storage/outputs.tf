# Cloud Storage Module Outputs

output "app_storage_bucket_name" {
  description = "Application storage bucket name"
  value       = google_storage_bucket.app_storage.name
}

output "app_storage_bucket_url" {
  description = "Application storage bucket URL"
  value       = google_storage_bucket.app_storage.url
}

output "app_storage_bucket_self_link" {
  description = "Application storage bucket self link"
  value       = google_storage_bucket.app_storage.self_link
}

output "artifacts_bucket_name" {
  description = "Artifacts bucket name"
  value       = google_storage_bucket.artifacts.name
}

output "artifacts_bucket_url" {
  description = "Artifacts bucket URL"
  value       = google_storage_bucket.artifacts.url
}

output "logs_bucket_name" {
  description = "Logs bucket name"
  value       = var.enable_logging && var.log_bucket == "" ? google_storage_bucket.logs[0].name : var.log_bucket
}

output "storage_service_account_email" {
  description = "Storage access service account email"
  value       = google_service_account.storage_access.email
}

output "cdn_backend_bucket_name" {
  description = "CDN backend bucket name"
  value       = var.enable_cdn ? google_compute_backend_bucket.cdn[0].name : null
}

output "gsutil_uri_app_storage" {
  description = "gsutil URI for app storage"
  value       = "gs://${google_storage_bucket.app_storage.name}"
}

output "gsutil_uri_artifacts" {
  description = "gsutil URI for artifacts"
  value       = "gs://${google_storage_bucket.artifacts.name}"
}
