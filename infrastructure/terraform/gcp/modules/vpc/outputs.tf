# VPC Module Outputs

output "network_id" {
  description = "VPC network ID"
  value       = google_compute_network.vpc.id
}

output "network_name" {
  description = "VPC network name"
  value       = google_compute_network.vpc.name
}

output "network_self_link" {
  description = "VPC network self link"
  value       = google_compute_network.vpc.self_link
}

output "gke_subnet_name" {
  description = "GKE subnet name"
  value       = google_compute_subnetwork.gke.name
}

output "gke_subnet_self_link" {
  description = "GKE subnet self link"
  value       = google_compute_subnetwork.gke.self_link
}

output "data_subnet_name" {
  description = "Data subnet name"
  value       = google_compute_subnetwork.data.name
}

output "data_subnet_self_link" {
  description = "Data subnet self link"
  value       = google_compute_subnetwork.data.self_link
}

output "private_subnet_name" {
  description = "Private subnet name"
  value       = google_compute_subnetwork.private.name
}

output "cloud_router_name" {
  description = "Cloud Router name"
  value       = google_compute_router.router.name
}

output "cloud_nat_name" {
  description = "Cloud NAT name"
  value       = google_compute_router_nat.nat.name
}

output "private_vpc_connection_name" {
  description = "Private VPC connection name for Cloud SQL"
  value       = google_service_networking_connection.private_vpc_connection.network
}
