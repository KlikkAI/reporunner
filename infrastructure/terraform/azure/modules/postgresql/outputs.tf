# Azure PostgreSQL Module Outputs

output "server_id" {
  description = "PostgreSQL server ID"
  value       = azurerm_postgresql_flexible_server.main.id
}

output "server_name" {
  description = "PostgreSQL server name"
  value       = azurerm_postgresql_flexible_server.main.name
}

output "server_fqdn" {
  description = "PostgreSQL server FQDN"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "administrator_login" {
  description = "Administrator login name"
  value       = azurerm_postgresql_flexible_server.main.administrator_login
}

output "database_name" {
  description = "Database name"
  value       = azurerm_postgresql_flexible_server_database.reporunner.name
}

output "database_password" {
  description = "Database password"
  value       = random_password.db_password.result
  sensitive   = true
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${azurerm_postgresql_flexible_server.main.administrator_login}@${azurerm_postgresql_flexible_server.main.name}:${random_password.db_password.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${azurerm_postgresql_flexible_server_database.reporunner.name}?sslmode=require"
  sensitive   = true
}

output "psql_command" {
  description = "Command to connect with psql"
  value       = "psql 'host=${azurerm_postgresql_flexible_server.main.fqdn} port=5432 dbname=${azurerm_postgresql_flexible_server_database.reporunner.name} user=${azurerm_postgresql_flexible_server.main.administrator_login} sslmode=require'"
}

output "private_dns_zone_id" {
  description = "Private DNS zone ID"
  value       = azurerm_private_dns_zone.postgresql.id
}
