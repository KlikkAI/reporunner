# Azure Cosmos DB Module (MongoDB API)

# Cosmos DB Account
resource "azurerm_cosmosdb_account" "main" {
  name                = "${var.name_prefix}-cosmosdb"
  location            = var.location
  resource_group_name = var.resource_group_name
  offer_type          = "Standard"
  kind                = "MongoDB"

  # Capabilities for MongoDB
  capabilities {
    name = "EnableMongo"
  }

  capabilities {
    name = "EnableServerless"
  }

  # Consistency policy
  consistency_policy {
    consistency_level       = var.consistency_level
    max_interval_in_seconds = var.max_interval_in_seconds
    max_staleness_prefix    = var.max_staleness_prefix
  }

  # Geo-replication locations
  dynamic "geo_location" {
    for_each = var.failover_locations
    content {
      location          = geo_location.value
      failover_priority = geo_location.key + 1
    }
  }

  # Primary location
  geo_location {
    location          = var.location
    failover_priority = 0
  }

  # Automatic failover
  enable_automatic_failover = var.enable_automatic_failover

  # Multiple write locations
  enable_multiple_write_locations = var.enable_multiple_write_locations

  # Free tier (for dev)
  enable_free_tier = var.enable_free_tier

  # Backup
  backup {
    type                = var.backup_type
    interval_in_minutes = var.backup_interval_minutes
    retention_in_hours  = var.backup_retention_hours
    storage_redundancy  = var.backup_storage_redundancy
  }

  # Network access
  is_virtual_network_filter_enabled = var.enable_vnet_filter
  public_network_access_enabled     = !var.disable_public_access

  # Virtual network rules
  dynamic "virtual_network_rule" {
    for_each = var.vnet_subnet_ids
    content {
      id = virtual_network_rule.value
    }
  }

  # IP rules
  ip_range_filter = var.ip_range_filter

  tags = var.tags
}

# MongoDB Database
resource "azurerm_cosmosdb_mongo_database" "main" {
  name                = var.database_name
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  throughput          = var.serverless_mode ? null : var.database_throughput

  dynamic "autoscale_settings" {
    for_each = !var.serverless_mode && var.enable_autoscale ? [1] : []
    content {
      max_throughput = var.max_throughput
    }
  }
}

# MongoDB Collections
resource "azurerm_cosmosdb_mongo_collection" "workflows" {
  name                = "workflows"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.main.name

  default_ttl_seconds = var.default_ttl_seconds
  shard_key           = var.shard_key

  index {
    keys   = ["_id"]
    unique = true
  }

  index {
    keys   = ["userId", "createdAt"]
    unique = false
  }
}

resource "azurerm_cosmosdb_mongo_collection" "executions" {
  name                = "executions"
  resource_group_name = var.resource_group_name
  account_name        = azurerm_cosmosdb_account.main.name
  database_name       = azurerm_cosmosdb_mongo_database.main.name

  default_ttl_seconds = var.execution_ttl_seconds
  shard_key           = var.shard_key

  index {
    keys   = ["_id"]
    unique = true
  }

  index {
    keys   = ["workflowId", "createdAt"]
    unique = false
  }
}

# Store connection string in Key Vault (if provided)
resource "azurerm_key_vault_secret" "cosmosdb_connection" {
  count = var.key_vault_id != "" ? 1 : 0

  name         = "${var.name_prefix}-cosmosdb-connection"
  value        = azurerm_cosmosdb_account.main.connection_strings[0]
  key_vault_id = var.key_vault_id

  tags = var.tags
}
