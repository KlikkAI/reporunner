# Load Balancer Module Outputs

output "load_balancer_ip" {
  description = "Load balancer IP address"
  value       = google_compute_global_address.default.address
}

output "load_balancer_ip_name" {
  description = "Load balancer IP address name"
  value       = google_compute_global_address.default.name
}

output "backend_service_id" {
  description = "Backend service ID"
  value       = google_compute_backend_service.default.id
}

output "backend_service_self_link" {
  description = "Backend service self link"
  value       = google_compute_backend_service.default.self_link
}

output "health_check_id" {
  description = "Health check ID"
  value       = google_compute_health_check.default.id
}

output "ssl_certificate_id" {
  description = "SSL certificate ID"
  value       = var.enable_https && var.ssl_certificate_domains != null ? google_compute_managed_ssl_certificate.default[0].id : null
}

output "url_map_id" {
  description = "URL map ID"
  value       = google_compute_url_map.default.id
}

output "https_proxy_id" {
  description = "HTTPS proxy ID"
  value       = var.enable_https ? google_compute_target_https_proxy.default[0].id : null
}

output "http_proxy_id" {
  description = "HTTP proxy ID"
  value       = !var.enable_https || var.enable_http_to_https_redirect ? google_compute_target_http_proxy.default[0].id : null
}

output "cloud_armor_policy_id" {
  description = "Cloud Armor security policy ID"
  value       = var.create_cloud_armor_policy ? google_compute_security_policy.default[0].id : null
}

output "application_url_http" {
  description = "Application HTTP URL"
  value       = "http://${google_compute_global_address.default.address}"
}

output "application_url_https" {
  description = "Application HTTPS URL"
  value       = var.enable_https ? "https://${google_compute_global_address.default.address}" : null
}

output "dns_records_needed" {
  description = "DNS A records needed for custom domains"
  value = var.ssl_certificate_domains != null ? {
    for domain in var.ssl_certificate_domains :
    domain => google_compute_global_address.default.address
  } : {}
}
