# GKE Module Outputs

output "cluster_id" {
  description = "GKE cluster ID"
  value       = google_container_cluster.primary.id
}

output "cluster_name" {
  description = "GKE cluster name"
  value       = google_container_cluster.primary.name
}

output "cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = google_container_cluster.primary.endpoint
  sensitive   = true
}

output "cluster_ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = google_container_cluster.primary.master_auth[0].cluster_ca_certificate
  sensitive   = true
}

output "cluster_location" {
  description = "GKE cluster location"
  value       = google_container_cluster.primary.location
}

output "cluster_self_link" {
  description = "GKE cluster self link"
  value       = google_container_cluster.primary.self_link
}

output "workload_identity_service_account_email" {
  description = "Workload Identity service account email"
  value       = google_service_account.gke_workload.email
}

output "node_pool_name" {
  description = "Node pool name"
  value       = var.enable_autopilot ? null : google_container_node_pool.primary_nodes[0].name
}

output "node_pool_instance_group_urls" {
  description = "Node pool instance group URLs"
  value       = var.enable_autopilot ? [] : google_container_node_pool.primary_nodes[0].instance_group_urls
}

output "kubectl_config_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${google_container_cluster.primary.name} --region ${var.region} --project ${var.project_id}"
}
