# Monitoring Module Outputs

output "email_notification_channel_id" {
  description = "Email notification channel ID"
  value       = var.alert_email != "" ? google_monitoring_notification_channel.email[0].id : null
}

output "pagerduty_notification_channel_id" {
  description = "PagerDuty notification channel ID"
  value       = var.pagerduty_service_key != "" ? google_monitoring_notification_channel.pagerduty[0].id : null
}

output "uptime_check_id" {
  description = "Uptime check ID"
  value       = var.create_uptime_checks ? google_monitoring_uptime_check_config.app_uptime[0].uptime_check_id : null
}

output "uptime_alert_policy_id" {
  description = "Uptime alert policy ID"
  value       = var.create_uptime_checks && (var.alert_email != "" || var.pagerduty_service_key != "") ? google_monitoring_alert_policy.uptime[0].id : null
}

output "gke_cpu_alert_policy_id" {
  description = "GKE CPU alert policy ID"
  value       = var.create_gke_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? google_monitoring_alert_policy.gke_cpu[0].id : null
}

output "gke_memory_alert_policy_id" {
  description = "GKE memory alert policy ID"
  value       = var.create_gke_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? google_monitoring_alert_policy.gke_memory[0].id : null
}

output "cloudsql_cpu_alert_policy_id" {
  description = "Cloud SQL CPU alert policy ID"
  value       = var.create_cloudsql_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? google_monitoring_alert_policy.cloudsql_cpu[0].id : null
}

output "cloudsql_memory_alert_policy_id" {
  description = "Cloud SQL memory alert policy ID"
  value       = var.create_cloudsql_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? google_monitoring_alert_policy.cloudsql_memory[0].id : null
}

output "cloudsql_storage_alert_policy_id" {
  description = "Cloud SQL storage alert policy ID"
  value       = var.create_cloudsql_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? google_monitoring_alert_policy.cloudsql_storage[0].id : null
}

output "redis_memory_alert_policy_id" {
  description = "Redis memory alert policy ID"
  value       = var.create_redis_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? google_monitoring_alert_policy.redis_memory[0].id : null
}

output "lb_5xx_errors_alert_policy_id" {
  description = "Load balancer 5xx errors alert policy ID"
  value       = var.create_lb_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? google_monitoring_alert_policy.lb_5xx_errors[0].id : null
}

output "dashboard_id" {
  description = "Monitoring dashboard ID"
  value       = var.create_dashboard ? google_monitoring_dashboard.main[0].id : null
}

output "dashboard_url" {
  description = "URL to monitoring dashboard"
  value       = var.create_dashboard ? "https://console.cloud.google.com/monitoring/dashboards/custom/${google_monitoring_dashboard.main[0].id}?project=${var.project_id}" : null
}
