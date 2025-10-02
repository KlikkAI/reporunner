# Azure Monitoring Module

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.name_prefix}-logs"
  location            = var.location
  resource_group_name = var.resource_group_name
  sku                 = var.log_analytics_sku
  retention_in_days   = var.log_retention_days

  tags = var.tags
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.name_prefix}-appinsights"
  location            = var.location
  resource_group_name = var.resource_group_name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  retention_in_days = var.app_insights_retention_days

  tags = var.tags
}

# Action Group for alerts
resource "azurerm_monitor_action_group" "main" {
  name                = "${var.name_prefix}-action-group"
  resource_group_name = var.resource_group_name
  short_name          = substr(var.name_prefix, 0, 12)

  # Email notifications
  dynamic "email_receiver" {
    for_each = var.alert_emails
    content {
      name          = "email-${email_receiver.key}"
      email_address = email_receiver.value
    }
  }

  tags = var.tags
}

# Metric alert for AKS CPU
resource "azurerm_monitor_metric_alert" "aks_cpu" {
  count = var.enable_aks_alerts && var.aks_cluster_id != "" ? 1 : 0

  name                = "${var.name_prefix}-aks-cpu-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "Alert when AKS CPU usage is high"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_cpu_usage_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  window_size        = "PT5M"
  frequency          = "PT1M"
  severity           = 2
  auto_mitigate      = true
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Metric alert for AKS memory
resource "azurerm_monitor_metric_alert" "aks_memory" {
  count = var.enable_aks_alerts && var.aks_cluster_id != "" ? 1 : 0

  name                = "${var.name_prefix}-aks-memory-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.aks_cluster_id]
  description         = "Alert when AKS memory usage is high"

  criteria {
    metric_namespace = "Microsoft.ContainerService/managedClusters"
    metric_name      = "node_memory_working_set_percentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  window_size        = "PT5M"
  frequency          = "PT1M"
  severity           = 2
  auto_mitigate      = true
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Metric alert for PostgreSQL CPU
resource "azurerm_monitor_metric_alert" "postgresql_cpu" {
  count = var.enable_postgresql_alerts && var.postgresql_server_id != "" ? 1 : 0

  name                = "${var.name_prefix}-postgresql-cpu-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.postgresql_server_id]
  description         = "Alert when PostgreSQL CPU usage is high"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "cpu_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  window_size        = "PT5M"
  frequency          = "PT1M"
  severity           = 2
  auto_mitigate      = true
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Metric alert for PostgreSQL memory
resource "azurerm_monitor_metric_alert" "postgresql_memory" {
  count = var.enable_postgresql_alerts && var.postgresql_server_id != "" ? 1 : 0

  name                = "${var.name_prefix}-postgresql-memory-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.postgresql_server_id]
  description         = "Alert when PostgreSQL memory usage is high"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "memory_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 90
  }

  window_size        = "PT5M"
  frequency          = "PT1M"
  severity           = 2
  auto_mitigate      = true
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Metric alert for PostgreSQL storage
resource "azurerm_monitor_metric_alert" "postgresql_storage" {
  count = var.enable_postgresql_alerts && var.postgresql_server_id != "" ? 1 : 0

  name                = "${var.name_prefix}-postgresql-storage-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.postgresql_server_id]
  description         = "Alert when PostgreSQL storage usage is high"

  criteria {
    metric_namespace = "Microsoft.DBforPostgreSQL/flexibleServers"
    metric_name      = "storage_percent"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  window_size        = "PT5M"
  frequency          = "PT1M"
  severity           = 2
  auto_mitigate      = true
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Metric alert for Redis memory
resource "azurerm_monitor_metric_alert" "redis_memory" {
  count = var.enable_redis_alerts && var.redis_cache_id != "" ? 1 : 0

  name                = "${var.name_prefix}-redis-memory-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.redis_cache_id]
  description         = "Alert when Redis memory usage is high"

  criteria {
    metric_namespace = "Microsoft.Cache/Redis"
    metric_name      = "usedmemorypercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 85
  }

  window_size        = "PT5M"
  frequency          = "PT1M"
  severity           = 2
  auto_mitigate      = true
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Metric alert for Application Gateway 5xx errors
resource "azurerm_monitor_metric_alert" "appgw_5xx" {
  count = var.enable_appgw_alerts && var.app_gateway_id != "" ? 1 : 0

  name                = "${var.name_prefix}-appgw-5xx-alert"
  resource_group_name = var.resource_group_name
  scopes              = [var.app_gateway_id]
  description         = "Alert when Application Gateway returns 5xx errors"

  criteria {
    metric_namespace = "Microsoft.Network/applicationGateways"
    metric_name      = "ResponseStatus"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 10

    dimension {
      name     = "HttpStatusGroup"
      operator = "Include"
      values   = ["5xx"]
    }
  }

  window_size        = "PT5M"
  frequency          = "PT1M"
  severity           = 2
  auto_mitigate      = true
  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }

  tags = var.tags
}

# Dashboard (Azure Portal)
resource "azurerm_portal_dashboard" "main" {
  count = var.create_dashboard ? 1 : 0

  name                = "${var.name_prefix}-dashboard"
  resource_group_name = var.resource_group_name
  location            = var.location
  dashboard_properties = jsonencode({
    lenses = {
      "0" = {
        order = 0
        parts = {
          "0" = {
            position = {
              x        = 0
              y        = 0
              rowSpan  = 4
              colSpan  = 6
            }
            metadata = {
              type = "Extension/HubsExtension/PartType/MonitorChartPart"
              settings = {
                content = {
                  chartId = "${var.name_prefix}-aks-cpu"
                }
              }
            }
          }
        }
      }
    }
  })

  tags = var.tags
}
