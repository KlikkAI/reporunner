/**
 * RDS Module Outputs
 */

output "endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "address" {
  description = "RDS instance address"
  value       = aws_db_instance.main.address
}

output "port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "database_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${var.master_username}:${random_password.master.result}@${aws_db_instance.main.endpoint}/${var.database_name}"
  sensitive   = true
}

output "secret_arn" {
  description = "Secrets Manager secret ARN for database credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}
