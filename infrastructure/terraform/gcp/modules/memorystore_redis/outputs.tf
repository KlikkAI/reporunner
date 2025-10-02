# Memorystore Redis Module Outputs

output "instance_id" {
  description = "Redis instance ID"
  value       = google_redis_instance.redis.id
}

output "instance_name" {
  description = "Redis instance name"
  value       = google_redis_instance.redis.name
}

output "host" {
  description = "Redis instance host"
  value       = google_redis_instance.redis.host
}

output "port" {
  description = "Redis instance port"
  value       = google_redis_instance.redis.port
}

output "current_location_id" {
  description = "Redis instance current location"
  value       = google_redis_instance.redis.current_location_id
}

output "persistence_iam_identity" {
  description = "Redis persistence IAM identity"
  value       = google_redis_instance.redis.persistence_iam_identity
}

output "auth_string" {
  description = "Redis AUTH string (sensitive)"
  value       = var.auth_enabled ? google_redis_instance.redis.auth_string : null
  sensitive   = true
}

output "auth_secret_name" {
  description = "Secret Manager secret name for Redis auth string"
  value       = var.auth_enabled ? google_secret_manager_secret.redis_auth[0].secret_id : null
}

output "connection_string" {
  description = "Redis connection string"
  value       = var.auth_enabled ? "redis://default:AUTH_STRING@${google_redis_instance.redis.host}:${google_redis_instance.redis.port}" : "redis://${google_redis_instance.redis.host}:${google_redis_instance.redis.port}"
}

output "redis_cli_command" {
  description = "Command to connect with redis-cli"
  value       = var.auth_enabled ? "redis-cli -h ${google_redis_instance.redis.host} -p ${google_redis_instance.redis.port} -a AUTH_STRING" : "redis-cli -h ${google_redis_instance.redis.host} -p ${google_redis_instance.redis.port}"
}
