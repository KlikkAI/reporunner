/**
 * Azure Infrastructure Outputs
 */

# Resource Group
output "resource_group_name" {
  description = "Resource group name"
  value       = azurerm_resource_group.main.name
}

# Network
output "vnet_id" {
  description = "Virtual Network ID"
  value       = module.vnet.vnet_id
}

# AKS
output "aks_cluster_name" {
  description = "AKS cluster name"
  value       = module.aks.cluster_name
}

output "aks_kube_config_command" {
  description = "Command to get kubeconfig"
  value       = "az aks get-credentials --resource-group ${azurerm_resource_group.main.name} --name ${module.aks.cluster_name}"
}

# PostgreSQL
output "postgresql_fqdn" {
  description = "PostgreSQL FQDN"
  value       = module.postgresql.fqdn
}

output "postgresql_connection_string" {
  description = "PostgreSQL connection string"
  value       = module.postgresql.connection_string
  sensitive   = true
}

# Cosmos DB
output "cosmosdb_endpoint" {
  description = "Cosmos DB endpoint"
  value       = module.cosmosdb.endpoint
}

output "cosmosdb_connection_string" {
  description = "Cosmos DB connection string"
  value       = module.cosmosdb.connection_string
  sensitive   = true
}

# Redis
output "redis_hostname" {
  description = "Redis hostname"
  value       = module.redis.hostname
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = module.redis.connection_string
  sensitive   = true
}

# Storage
output "storage_account_name" {
  description = "Storage account name"
  value       = module.storage.storage_account_name
}

output "storage_primary_blob_endpoint" {
  description = "Storage primary blob endpoint"
  value       = module.storage.primary_blob_endpoint
}

# Application Gateway
output "app_gateway_public_ip" {
  description = "Application Gateway public IP"
  value       = module.app_gateway.public_ip
}

output "application_url" {
  description = "Application URL"
  value       = "https://${module.app_gateway.public_ip}"
}

# Key Vault
output "key_vault_uri" {
  description = "Key Vault URI"
  value       = azurerm_key_vault.main.vault_uri
}

# Managed Identity
output "workload_identity_client_id" {
  description = "Workload identity client ID"
  value       = azurerm_user_assigned_identity.aks_workload.client_id
}

# Monitoring
output "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID"
  value       = module.monitoring.log_analytics_workspace_id
}

# Deployment Summary
output "deployment_summary" {
  description = "Complete deployment information"
  value = {
    environment          = var.environment
    location             = var.location
    resource_group       = azurerm_resource_group.main.name
    aks_cluster          = module.aks.cluster_name
    postgresql_server    = module.postgresql.server_name
    cosmosdb_account     = module.cosmosdb.account_name
    redis_cache          = module.redis.redis_name
    storage_account      = module.storage.storage_account_name
    application_url      = "https://${module.app_gateway.public_ip}"
    key_vault           = azurerm_key_vault.main.name
  }
}

# Connection Instructions
output "connection_instructions" {
  description = "Instructions for connecting to infrastructure"
  value = <<-EOT
    # Configure kubectl
    az aks get-credentials --resource-group ${azurerm_resource_group.main.name} --name ${module.aks.cluster_name}

    # View secrets in Key Vault
    az keyvault secret show --vault-name ${azurerm_key_vault.main.name} --name postgresql-connection-string
    az keyvault secret show --vault-name ${azurerm_key_vault.main.name} --name cosmosdb-connection-string
    az keyvault secret show --vault-name ${azurerm_key_vault.main.name} --name redis-connection-string

    # Access application
    Application URL: https://${module.app_gateway.public_ip}

    # View logs
    az monitor log-analytics workspace show --resource-group ${azurerm_resource_group.main.name} --workspace-name ${module.monitoring.log_analytics_workspace_name}
  EOT
}
