/**
 * DocumentDB Module Outputs
 */

output "endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = aws_docdb_cluster.main.endpoint
}

output "reader_endpoint" {
  description = "DocumentDB cluster reader endpoint"
  value       = aws_docdb_cluster.main.reader_endpoint
}

output "port" {
  description = "DocumentDB cluster port"
  value       = aws_docdb_cluster.main.port
}

output "cluster_id" {
  description = "DocumentDB cluster ID"
  value       = aws_docdb_cluster.main.id
}

output "connection_string" {
  description = "MongoDB connection string"
  value       = "mongodb://${var.master_username}:${random_password.master.result}@${aws_docdb_cluster.main.endpoint}:${aws_docdb_cluster.main.port}/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
  sensitive   = true
}

output "secret_arn" {
  description = "Secrets Manager secret ARN for DocumentDB credentials"
  value       = aws_secretsmanager_secret.docdb_credentials.arn
}
