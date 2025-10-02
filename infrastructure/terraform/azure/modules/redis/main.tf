# Azure Cache for Redis Module

# Redis Cache
resource "azurerm_redis_cache" "main" {
  name                = "${var.name_prefix}-redis"
  location            = var.location
  resource_group_name = var.resource_group_name
  capacity            = var.capacity
  family              = var.family
  sku_name            = var.sku_name

  # Enable non-SSL port
  enable_non_ssl_port = var.enable_non_ssl_port
  minimum_tls_version = var.minimum_tls_version

  # Subnet (Premium SKU only)
  subnet_id = var.sku_name == "Premium" ? var.subnet_id : null

  # Public network access
  public_network_access_enabled = var.public_network_access_enabled

  # Shard count (Premium only)
  shard_count = var.sku_name == "Premium" ? var.shard_count : null

  # Zones (Standard and Premium)
  zones = var.sku_name != "Basic" ? var.zones : null

  # Redis configuration
  redis_configuration {
    maxmemory_reserved              = var.maxmemory_reserved
    maxmemory_delta                 = var.maxmemory_delta
    maxmemory_policy                = var.maxmemory_policy
    maxfragmentationmemory_reserved = var.maxfragmentationmemory_reserved
    rdb_backup_enabled              = var.sku_name == "Premium" ? var.rdb_backup_enabled : null
    rdb_backup_frequency            = var.sku_name == "Premium" && var.rdb_backup_enabled ? var.rdb_backup_frequency : null
    rdb_backup_max_snapshot_count   = var.sku_name == "Premium" && var.rdb_backup_enabled ? var.rdb_backup_max_snapshot_count : null
    rdb_storage_connection_string   = var.sku_name == "Premium" && var.rdb_backup_enabled ? var.rdb_storage_connection_string : null
  }

  # Patch schedule
  dynamic "patch_schedule" {
    for_each = var.patch_schedule_day != "" ? [1] : []
    content {
      day_of_week        = var.patch_schedule_day
      start_hour_utc     = var.patch_schedule_hour
      maintenance_window = "PT5H"
    }
  }

  tags = var.tags
}

# Private endpoint (if enabled)
resource "azurerm_private_endpoint" "redis" {
  count = var.enable_private_endpoint ? 1 : 0

  name                = "${var.name_prefix}-redis-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.name_prefix}-redis-psc"
    private_connection_resource_id = azurerm_redis_cache.main.id
    subresource_names              = ["redisCache"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# Store access keys in Key Vault (if provided)
resource "azurerm_key_vault_secret" "redis_primary_key" {
  count = var.key_vault_id != "" ? 1 : 0

  name         = "${var.name_prefix}-redis-primary-key"
  value        = azurerm_redis_cache.main.primary_access_key
  key_vault_id = var.key_vault_id

  tags = var.tags
}

resource "azurerm_key_vault_secret" "redis_connection_string" {
  count = var.key_vault_id != "" ? 1 : 0

  name         = "${var.name_prefix}-redis-connection"
  value        = azurerm_redis_cache.main.primary_connection_string
  key_vault_id = var.key_vault_id

  tags = var.tags
}
