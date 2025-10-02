# Reporunner Azure Production Environment
# High-availability production setup

environment  = "production"
project_name = "reporunner"
location     = "eastus"

# Network
vnet_address_space = ["10.20.0.0/16"]
subnet_cidrs = {
  aks      = ["10.20.1.0/24"]
  database = ["10.20.2.0/24"]
  appgw    = ["10.20.3.0/24"]
}

# AKS - High Performance
kubernetes_version      = "1.28"
aks_node_count          = 3
aks_vm_size             = "Standard_D8s_v3"  # 8 vCPU, 32 GB RAM
aks_os_disk_size_gb     = 256
aks_enable_auto_scaling = true
aks_min_count           = 3
aks_max_count           = 20
aks_enable_azure_policy = true
aks_enable_private_cluster = true

# PostgreSQL - High Performance
postgresql_version            = "15"
postgresql_sku_name           = "GP_Standard_D8s_v3"  # 8 vCore, 32 GB RAM
postgresql_storage_mb         = 524288  # 512 GB
postgresql_backup_retention_days = 35
postgresql_geo_redundant_backup  = true
postgresql_high_availability     = true
postgresql_zone                  = "1"

# Cosmos DB - Production
cosmosdb_consistency_level  = "BoundedStaleness"
cosmosdb_max_interval       = 5
cosmosdb_max_staleness      = 100
cosmosdb_enable_failover    = true
cosmosdb_failover_locations = ["westus", "centralus"]
cosmosdb_throughput         = 4000  # RU/s

# Redis - Premium
redis_capacity   = 1  # 6 GB
redis_family     = "P"
redis_sku_name   = "Premium"
redis_version    = "6"
redis_shard_count = 2
redis_zones      = ["1", "2"]

# Storage
storage_account_tier     = "Premium"
storage_replication_type = "GZRS"  # Geo-zone redundant
storage_access_tier      = "Hot"
storage_enable_versioning = true
storage_enable_soft_delete = true
storage_soft_delete_retention = 30

# Application Gateway - WAF with HA
appgw_enable_waf  = true
appgw_sku_name    = "WAF_v2"
appgw_sku_tier    = "WAF_v2"
appgw_sku_capacity = 3

# Monitoring
log_analytics_retention_days = 365
alert_email = ""  # Set your email

# Security
deletion_protection = true
key_vault_allowed_ips = []  # Add your IP ranges

additional_tags = {
  compliance  = "sox,hipaa,gdpr"
  criticality = "high"
  backup      = "required"
}

# Estimated Monthly Cost: ~$2,500-3,000
# - AKS: $1,000-1,200 (3x Standard_D8s_v3)
# - PostgreSQL: $600-700 (GP D8s with HA + storage)
# - Cosmos DB: $300-400 (4000 RU/s multi-region)
# - Redis: $250-300 (Premium P1 with sharding)
# - Storage: $100-150 (Premium GZRS)
# - App Gateway: $250-300 (WAF_v2 capacity 3)
# - Log Analytics: $50-75
# - Data transfer: $100-150
