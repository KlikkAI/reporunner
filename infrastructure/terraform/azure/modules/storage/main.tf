# Azure Storage Account Module

# Storage Account
resource "azurerm_storage_account" "main" {
  name                     = replace("${var.name_prefix}storage", "-", "")
  resource_group_name      = var.resource_group_name
  location                 = var.location
  account_tier             = var.account_tier
  account_replication_type = var.replication_type
  account_kind             = var.account_kind
  access_tier              = var.access_tier

  # Security
  enable_https_traffic_only       = true
  min_tls_version                 = "TLS1_2"
  allow_nested_items_to_be_public = false
  shared_access_key_enabled       = true

  # Blob properties
  blob_properties {
    versioning_enabled  = var.enable_versioning
    change_feed_enabled = var.enable_change_feed

    # Soft delete for blobs
    dynamic "delete_retention_policy" {
      for_each = var.enable_soft_delete ? [1] : []
      content {
        days = var.soft_delete_retention_days
      }
    }

    # Container soft delete
    dynamic "container_delete_retention_policy" {
      for_each = var.enable_soft_delete ? [1] : []
      content {
        days = var.soft_delete_retention_days
      }
    }
  }

  # Network rules
  network_rules {
    default_action             = var.default_network_action
    bypass                     = ["AzureServices"]
    ip_rules                   = var.allowed_ip_ranges
    virtual_network_subnet_ids = var.allowed_subnet_ids
  }

  # Identity
  identity {
    type = "SystemAssigned"
  }

  tags = var.tags
}

# Blob container for application files
resource "azurerm_storage_container" "app_files" {
  name                  = "app-files"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Blob container for workflow artifacts
resource "azurerm_storage_container" "artifacts" {
  name                  = "artifacts"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Blob container for logs
resource "azurerm_storage_container" "logs" {
  name                  = "logs"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# File share (for persistent storage)
resource "azurerm_storage_share" "main" {
  name                 = "reporunner-share"
  storage_account_name = azurerm_storage_account.main.name
  quota                = var.file_share_quota_gb

  enabled_protocol = "SMB"
}

# Management policy for lifecycle management
resource "azurerm_storage_management_policy" "main" {
  count = var.enable_lifecycle_management ? 1 : 0

  storage_account_id = azurerm_storage_account.main.id

  rule {
    name    = "delete-old-artifacts"
    enabled = true

    filters {
      prefix_match = ["artifacts/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = var.artifact_retention_days
      }
    }
  }

  rule {
    name    = "delete-old-logs"
    enabled = true

    filters {
      prefix_match = ["logs/"]
      blob_types   = ["blockBlob"]
    }

    actions {
      base_blob {
        delete_after_days_since_modification_greater_than = var.log_retention_days
      }
    }
  }
}

# Private endpoint (if enabled)
resource "azurerm_private_endpoint" "storage_blob" {
  count = var.enable_private_endpoint ? 1 : 0

  name                = "${var.name_prefix}-storage-blob-pe"
  location            = var.location
  resource_group_name = var.resource_group_name
  subnet_id           = var.private_endpoint_subnet_id

  private_service_connection {
    name                           = "${var.name_prefix}-storage-blob-psc"
    private_connection_resource_id = azurerm_storage_account.main.id
    subresource_names              = ["blob"]
    is_manual_connection           = false
  }

  tags = var.tags
}

# Store access key in Key Vault (if provided)
resource "azurerm_key_vault_secret" "storage_key" {
  count = var.key_vault_id != "" ? 1 : 0

  name         = "${var.name_prefix}-storage-key"
  value        = azurerm_storage_account.main.primary_access_key
  key_vault_id = var.key_vault_id

  tags = var.tags
}

resource "azurerm_key_vault_secret" "storage_connection_string" {
  count = var.key_vault_id != "" ? 1 : 0

  name         = "${var.name_prefix}-storage-connection"
  value        = azurerm_storage_account.main.primary_connection_string
  key_vault_id = var.key_vault_id

  tags = var.tags
}
