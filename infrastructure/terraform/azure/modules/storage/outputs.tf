# Azure Storage Module Outputs

output "storage_account_id" {
  description = "Storage account ID"
  value       = azurerm_storage_account.main.id
}

output "storage_account_name" {
  description = "Storage account name"
  value       = azurerm_storage_account.main.name
}

output "primary_blob_endpoint" {
  description = "Primary blob endpoint"
  value       = azurerm_storage_account.main.primary_blob_endpoint
}

output "primary_file_endpoint" {
  description = "Primary file endpoint"
  value       = azurerm_storage_account.main.primary_file_endpoint
}

output "primary_access_key" {
  description = "Primary access key"
  value       = azurerm_storage_account.main.primary_access_key
  sensitive   = true
}

output "primary_connection_string" {
  description = "Primary connection string"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

output "app_files_container_name" {
  description = "App files container name"
  value       = azurerm_storage_container.app_files.name
}

output "artifacts_container_name" {
  description = "Artifacts container name"
  value       = azurerm_storage_container.artifacts.name
}

output "logs_container_name" {
  description = "Logs container name"
  value       = azurerm_storage_container.logs.name
}

output "file_share_name" {
  description = "File share name"
  value       = azurerm_storage_share.main.name
}

output "system_assigned_identity_principal_id" {
  description = "System assigned identity principal ID"
  value       = azurerm_storage_account.main.identity[0].principal_id
}
