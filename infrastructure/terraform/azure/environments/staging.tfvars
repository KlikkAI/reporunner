# Reporunner Azure Staging Environment
# Production-like for pre-production testing

environment  = "staging"
project_name = "reporunner"
location     = "eastus"

# Network
vnet_address_space = ["10.10.0.0/16"]
subnet_cidrs = {
  aks      = ["10.10.1.0/24"]
  database = ["10.10.2.0/24"]
  appgw    = ["10.10.3.0/24"]
}

# AKS - Medium
kubernetes_version      = "1.28"
aks_node_count          = 2
aks_vm_size             = "Standard_D4s_v3"  # 4 vCPU, 16 GB RAM
aks_os_disk_size_gb     = 128
aks_enable_auto_scaling = true
aks_min_count           = 2
aks_max_count           = 8
aks_enable_azure_policy = true
aks_enable_private_cluster = true

# PostgreSQL - General Purpose
postgresql_version            = "15"
postgresql_sku_name           = "GP_Standard_D2s_v3"  # 2 vCore, 8 GB RAM
postgresql_storage_mb         = 204800  # 200 GB
postgresql_backup_retention_days = 14
postgresql_geo_redundant_backup  = true
postgresql_high_availability     = true

# Cosmos DB - Standard
cosmosdb_consistency_level  = "Session"
cosmosdb_enable_failover    = true
cosmosdb_failover_locations = ["westus"]
cosmosdb_throughput         = 1000  # RU/s

# Redis - Standard
redis_capacity   = 1  # 1 GB
redis_family     = "C"
redis_sku_name   = "Standard"
redis_version    = "6"

# Storage
storage_account_tier     = "Standard"
storage_replication_type = "GRS"  # Geo-redundant
storage_access_tier      = "Hot"
storage_enable_versioning = true
storage_enable_soft_delete = true
storage_soft_delete_retention = 7

# Application Gateway - WAF
appgw_enable_waf  = true
appgw_sku_name    = "WAF_v2"
appgw_sku_tier    = "WAF_v2"
appgw_sku_capacity = 2

# Monitoring
log_analytics_retention_days = 90
alert_email = ""  # Set your email

# Security
deletion_protection = true

# Estimated Monthly Cost: ~$800-1,000
# - AKS: $350-400 (2x Standard_D4s_v3)
# - PostgreSQL: $200-250 (GP D2s with HA)
# - Cosmos DB: $75-100 (1000 RU/s with replication)
# - Redis: $75-90 (Standard C1)
# - Storage: $30-40 (GRS)
# - App Gateway: $150-180 (WAF_v2)
# - Log Analytics: $20-30
