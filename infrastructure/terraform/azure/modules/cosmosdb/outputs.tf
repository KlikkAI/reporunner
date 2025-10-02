# Azure Cosmos DB Module Outputs

output "account_id" {
  description = "Cosmos DB account ID"
  value       = azurerm_cosmosdb_account.main.id
}

output "account_name" {
  description = "Cosmos DB account name"
  value       = azurerm_cosmosdb_account.main.name
}

output "endpoint" {
  description = "Cosmos DB endpoint"
  value       = azurerm_cosmosdb_account.main.endpoint
}

output "primary_key" {
  description = "Cosmos DB primary key"
  value       = azurerm_cosmosdb_account.main.primary_key
  sensitive   = true
}

output "connection_strings" {
  description = "Cosmos DB connection strings"
  value       = azurerm_cosmosdb_account.main.connection_strings
  sensitive   = true
}

output "database_name" {
  description = "Database name"
  value       = azurerm_cosmosdb_mongo_database.main.name
}

output "mongodb_connection_string" {
  description = "MongoDB connection string"
  value       = azurerm_cosmosdb_account.main.connection_strings[0]
  sensitive   = true
}
