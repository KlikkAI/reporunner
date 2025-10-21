# Cloud SQL PostgreSQL Module Outputs

output "instance_name" {
  description = "Cloud SQL instance name"
  value       = google_sql_database_instance.postgresql.name
}

output "instance_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.postgresql.connection_name
}

output "instance_self_link" {
  description = "Cloud SQL instance self link"
  value       = google_sql_database_instance.postgresql.self_link
}

output "instance_ip_address" {
  description = "Cloud SQL instance IP address"
  value       = google_sql_database_instance.postgresql.ip_address
}

output "private_ip_address" {
  description = "Cloud SQL private IP address"
  value       = google_sql_database_instance.postgresql.private_ip_address
}

output "public_ip_address" {
  description = "Cloud SQL public IP address"
  value       = var.enable_public_ip ? google_sql_database_instance.postgresql.public_ip_address : null
}

output "database_name" {
  description = "Database name"
  value       = google_sql_database.klikkflow.name
}

output "database_user" {
  description = "Database user"
  value       = google_sql_user.klikkflow.name
}

output "database_password_secret" {
  description = "Secret Manager secret name for database password"
  value       = google_secret_manager_secret.db_password.secret_id
}

output "connection_string" {
  description = "PostgreSQL connection string (without password)"
  value       = "postgresql://${google_sql_user.klikkflow.name}@${google_sql_database_instance.postgresql.private_ip_address}:5432/${google_sql_database.klikkflow.name}?sslmode=require"
}

output "read_replica_connection_name" {
  description = "Read replica connection name"
  value       = var.create_read_replica ? google_sql_database_instance.read_replica[0].connection_name : null
}

output "read_replica_ip_address" {
  description = "Read replica private IP address"
  value       = var.create_read_replica ? google_sql_database_instance.read_replica[0].private_ip_address : null
}

output "psql_command" {
  description = "Command to connect with psql (requires password from Secret Manager)"
  value       = "psql 'host=${google_sql_database_instance.postgresql.private_ip_address} port=5432 dbname=${google_sql_database.klikkflow.name} user=${google_sql_user.klikkflow.name} sslmode=require'"
}
