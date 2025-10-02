# Azure PostgreSQL Flexible Server Module

# Random password for database
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# PostgreSQL Flexible Server
resource "azurerm_postgresql_flexible_server" "main" {
  name                = "${var.name_prefix}-postgresql"
  location            = var.location
  resource_group_name = var.resource_group_name

  administrator_login    = var.administrator_login
  administrator_password = random_password.db_password.result

  sku_name   = var.sku_name
  storage_mb = var.storage_mb
  version    = var.postgresql_version

  # Delegated subnet
  delegated_subnet_id = var.delegated_subnet_id
  private_dns_zone_id = azurerm_private_dns_zone.postgresql.id

  # High availability
  dynamic "high_availability" {
    for_each = var.high_availability_enabled ? [1] : []
    content {
      mode                      = "ZoneRedundant"
      standby_availability_zone = var.standby_availability_zone
    }
  }

  # Backup configuration
  backup_retention_days        = var.backup_retention_days
  geo_redundant_backup_enabled = var.geo_redundant_backup_enabled

  # Maintenance window
  maintenance_window {
    day_of_week  = var.maintenance_window_day
    start_hour   = var.maintenance_window_hour
    start_minute = 0
  }

  # Zone
  zone = var.zone

  tags = var.tags

  depends_on = [azurerm_private_dns_zone_virtual_network_link.postgresql]

  lifecycle {
    ignore_changes = [
      zone,
      high_availability[0].standby_availability_zone,
    ]
  }
}

# Private DNS Zone for PostgreSQL
resource "azurerm_private_dns_zone" "postgresql" {
  name                = "${var.name_prefix}.postgres.database.azure.com"
  resource_group_name = var.resource_group_name

  tags = var.tags
}

# Link Private DNS Zone to VNet
resource "azurerm_private_dns_zone_virtual_network_link" "postgresql" {
  name                  = "${var.name_prefix}-postgresql-dns-link"
  resource_group_name   = var.resource_group_name
  private_dns_zone_name = azurerm_private_dns_zone.postgresql.name
  virtual_network_id    = var.vnet_id

  tags = var.tags
}

# Database
resource "azurerm_postgresql_flexible_server_database" "reporunner" {
  name      = var.database_name
  server_id = azurerm_postgresql_flexible_server.main.id
  charset   = "UTF8"
  collation = "en_US.utf8"
}

# Enable pgvector extension
resource "azurerm_postgresql_flexible_server_configuration" "pgvector" {
  name      = "azure.extensions"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = "VECTOR,PGCRYPTO,UUID-OSSP"
}

# Performance configurations
resource "azurerm_postgresql_flexible_server_configuration" "shared_buffers" {
  name      = "shared_buffers"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.shared_buffers
}

resource "azurerm_postgresql_flexible_server_configuration" "effective_cache_size" {
  name      = "effective_cache_size"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.effective_cache_size
}

resource "azurerm_postgresql_flexible_server_configuration" "work_mem" {
  name      = "work_mem"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = var.work_mem
}

resource "azurerm_postgresql_flexible_server_configuration" "max_connections" {
  name      = "max_connections"
  server_id = azurerm_postgresql_flexible_server.main.id
  value     = tostring(var.max_connections)
}

# Firewall rule for Azure services (if needed)
resource "azurerm_postgresql_flexible_server_firewall_rule" "azure_services" {
  count = var.allow_azure_services ? 1 : 0

  name             = "AllowAzureServices"
  server_id        = azurerm_postgresql_flexible_server.main.id
  start_ip_address = "0.0.0.0"
  end_ip_address   = "0.0.0.0"
}

# Store password in Key Vault (if provided)
resource "azurerm_key_vault_secret" "db_password" {
  count = var.key_vault_id != "" ? 1 : 0

  name         = "${var.name_prefix}-postgresql-password"
  value        = random_password.db_password.result
  key_vault_id = var.key_vault_id

  tags = var.tags
}
