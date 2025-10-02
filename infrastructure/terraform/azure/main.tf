/**
 * Reporunner Azure Infrastructure
 *
 * Complete production-ready infrastructure on Microsoft Azure
 * - AKS (Azure Kubernetes Service) for container orchestration
 * - Azure Database for PostgreSQL Flexible Server with pgvector
 * - Azure Cosmos DB (MongoDB API)
 * - Azure Cache for Redis
 * - Azure Application Gateway
 * - Azure Storage Account
 * - Azure Monitor and Log Analytics
 */

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.80"
    }
    azuread = {
      source  = "hashicorp/azuread"
      version = "~> 2.45"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "azurerm" {
    storage_account_name = "reporunnerterraformstate"
    container_name       = "tfstate"
    key                  = "azure.terraform.tfstate"
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = var.deletion_protection
    }
    key_vault {
      purge_soft_delete_on_destroy    = !var.deletion_protection
      recover_soft_deleted_key_vaults = var.deletion_protection
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
    Platform    = "reporunner"
  }
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "${local.name_prefix}-rg"
  location = var.location

  tags = merge(local.common_tags, var.additional_tags)
}

# Virtual Network
module "vnet" {
  source = "./modules/vnet"

  name_prefix         = local.name_prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  vnet_address_space = var.vnet_address_space
  subnet_cidrs       = var.subnet_cidrs

  tags = local.common_tags
}

# AKS Cluster
module "aks" {
  source = "./modules/aks"

  name_prefix         = local.name_prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  vnet_subnet_id = module.vnet.aks_subnet_id

  kubernetes_version   = var.kubernetes_version
  node_count           = var.aks_node_count
  vm_size              = var.aks_vm_size
  os_disk_size_gb      = var.aks_os_disk_size_gb
  enable_auto_scaling  = var.aks_enable_auto_scaling
  min_count            = var.aks_min_count
  max_count            = var.aks_max_count

  enable_azure_policy      = var.aks_enable_azure_policy
  enable_private_cluster   = var.aks_enable_private_cluster
  enable_oms_agent         = true
  log_analytics_workspace_id = module.monitoring.log_analytics_workspace_id

  tags = local.common_tags
}

# Azure Database for PostgreSQL
module "postgresql" {
  source = "./modules/postgresql"

  name_prefix         = local.name_prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  vnet_subnet_id = module.vnet.database_subnet_id

  postgresql_version = var.postgresql_version
  sku_name           = var.postgresql_sku_name
  storage_mb         = var.postgresql_storage_mb

  backup_retention_days        = var.postgresql_backup_retention_days
  geo_redundant_backup_enabled = var.postgresql_geo_redundant_backup

  high_availability_enabled = var.postgresql_high_availability
  zone                      = var.postgresql_zone

  tags = local.common_tags
}

# Azure Cosmos DB (MongoDB API)
module "cosmosdb" {
  source = "./modules/cosmosdb"

  name_prefix         = local.name_prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  consistency_level       = var.cosmosdb_consistency_level
  max_interval_in_seconds = var.cosmosdb_max_interval
  max_staleness_prefix    = var.cosmosdb_max_staleness

  enable_automatic_failover = var.cosmosdb_enable_failover
  failover_locations        = var.cosmosdb_failover_locations

  throughput = var.cosmosdb_throughput

  tags = local.common_tags
}

# Azure Cache for Redis
module "redis" {
  source = "./modules/redis"

  name_prefix         = local.name_prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  capacity            = var.redis_capacity
  family              = var.redis_family
  sku_name            = var.redis_sku_name
  enable_non_ssl_port = false

  redis_version               = var.redis_version
  redis_configuration         = var.redis_configuration
  shard_count                 = var.redis_shard_count
  zones                       = var.redis_zones

  tags = local.common_tags
}

# Azure Storage Account
module "storage" {
  source = "./modules/storage"

  name_prefix         = local.name_prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  account_tier             = var.storage_account_tier
  account_replication_type = var.storage_replication_type
  access_tier              = var.storage_access_tier

  enable_versioning        = var.storage_enable_versioning
  enable_soft_delete       = var.storage_enable_soft_delete
  soft_delete_retention_days = var.storage_soft_delete_retention

  tags = local.common_tags
}

# Application Gateway (Load Balancer)
module "app_gateway" {
  source = "./modules/app-gateway"

  name_prefix         = local.name_prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  vnet_subnet_id = module.vnet.appgw_subnet_id

  enable_waf      = var.appgw_enable_waf
  sku_name        = var.appgw_sku_name
  sku_tier        = var.appgw_sku_tier
  sku_capacity    = var.appgw_sku_capacity

  backend_pools = {
    frontend = {
      port     = 3000
      protocol = "Http"
    }
    backend = {
      port     = 4000
      protocol = "Http"
    }
  }

  tags = local.common_tags
}

# Azure Monitor and Log Analytics
module "monitoring" {
  source = "./modules/monitoring"

  name_prefix         = local.name_prefix
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  retention_in_days = var.log_analytics_retention_days

  aks_cluster_id          = module.aks.cluster_id
  postgresql_server_id    = module.postgresql.server_id
  redis_cache_id          = module.redis.redis_id
  cosmosdb_account_id     = module.cosmosdb.account_id

  action_group_email = var.alert_email

  tags = local.common_tags
}

# Key Vault for Secrets
resource "azurerm_key_vault" "main" {
  name                = "${local.name_prefix}-kv"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id

  sku_name = "standard"

  purge_protection_enabled   = var.deletion_protection
  soft_delete_retention_days = 7

  network_acls {
    default_action = "Deny"
    bypass         = "AzureServices"
    ip_rules       = var.key_vault_allowed_ips
  }

  tags = merge(local.common_tags, var.additional_tags)
}

# Store database credentials in Key Vault
resource "azurerm_key_vault_secret" "postgresql_connection" {
  name         = "postgresql-connection-string"
  value        = module.postgresql.connection_string
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "cosmosdb_connection" {
  name         = "cosmosdb-connection-string"
  value        = module.cosmosdb.connection_string
  key_vault_id = azurerm_key_vault.main.id
}

resource "azurerm_key_vault_secret" "redis_connection" {
  name         = "redis-connection-string"
  value        = module.redis.connection_string
  key_vault_id = azurerm_key_vault.main.id
}

# Managed Identity for AKS workloads
resource "azurerm_user_assigned_identity" "aks_workload" {
  name                = "${local.name_prefix}-aks-workload-identity"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location

  tags = local.common_tags
}

# Grant permissions to managed identity
resource "azurerm_role_assignment" "aks_workload_keyvault" {
  scope                = azurerm_key_vault.main.id
  role_definition_name = "Key Vault Secrets User"
  principal_id         = azurerm_user_assigned_identity.aks_workload.principal_id
}

resource "azurerm_role_assignment" "aks_workload_storage" {
  scope                = module.storage.storage_account_id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.aks_workload.principal_id
}

# Data source for current client config
data "azurerm_client_config" "current" {}
