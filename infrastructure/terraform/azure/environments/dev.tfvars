# KlikkFlow Azure Development Environment
# Cost-optimized for development and testing

environment  = "dev"
project_name = "klikkflow"
location     = "eastus"

# Network
vnet_address_space = ["10.0.0.0/16"]
subnet_cidrs = {
  aks      = ["10.0.1.0/24"]
  database = ["10.0.2.0/24"]
  appgw    = ["10.0.3.0/24"]
}

# AKS - Minimal
kubernetes_version      = "1.28"
aks_node_count          = 1
aks_vm_size             = "Standard_B2s"  # 2 vCPU, 4 GB RAM
aks_os_disk_size_gb     = 64
aks_enable_auto_scaling = false
aks_enable_azure_policy = false
aks_enable_private_cluster = false

# PostgreSQL - Basic
postgresql_version            = "15"
postgresql_sku_name           = "B_Standard_B1ms"  # Burstable, 1 vCore
postgresql_storage_mb         = 32768  # 32 GB
postgresql_backup_retention_days = 7
postgresql_geo_redundant_backup  = false
postgresql_high_availability     = false

# Cosmos DB - Minimal
cosmosdb_consistency_level  = "Session"
cosmosdb_enable_failover    = false
cosmosdb_failover_locations = []
cosmosdb_throughput         = 400  # Minimum RU/s

# Redis - Basic
redis_capacity   = 0  # 250 MB
redis_family     = "C"
redis_sku_name   = "Basic"
redis_version    = "6"

# Storage
storage_account_tier     = "Standard"
storage_replication_type = "LRS"  # Locally redundant
storage_access_tier      = "Hot"
storage_enable_versioning = false
storage_enable_soft_delete = false

# Application Gateway - Standard
appgw_enable_waf  = false
appgw_sku_name    = "Standard_v2"
appgw_sku_tier    = "Standard_v2"
appgw_sku_capacity = 1

# Monitoring
log_analytics_retention_days = 30

# Security
deletion_protection = false

# Estimated Monthly Cost: ~$200-250
# - AKS: $70-90 (1x Standard_B2s)
# - PostgreSQL: $25-35 (B_Standard_B1ms)
# - Cosmos DB: $25-30 (400 RU/s)
# - Redis: $15-20 (Basic C0)
# - Storage: $10-15
# - App Gateway: $30-40 (Standard_v2)
# - Log Analytics: $10-15
