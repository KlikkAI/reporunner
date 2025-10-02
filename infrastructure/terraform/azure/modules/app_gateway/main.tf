# Azure Application Gateway Module

# Public IP for Application Gateway
resource "azurerm_public_ip" "appgw" {
  name                = "${var.name_prefix}-appgw-pip"
  location            = var.location
  resource_group_name = var.resource_group_name
  allocation_method   = "Static"
  sku                 = "Standard"
  zones               = var.zones

  tags = var.tags
}

# Application Gateway
resource "azurerm_application_gateway" "main" {
  name                = "${var.name_prefix}-appgw"
  location            = var.location
  resource_group_name = var.resource_group_name
  zones               = var.zones

  # SKU
  sku {
    name     = var.sku_name
    tier     = var.sku_tier
    capacity = var.enable_autoscale ? null : var.sku_capacity
  }

  # Autoscale (if enabled)
  dynamic "autoscale_configuration" {
    for_each = var.enable_autoscale ? [1] : []
    content {
      min_capacity = var.autoscale_min_capacity
      max_capacity = var.autoscale_max_capacity
    }
  }

  # Gateway IP configuration
  gateway_ip_configuration {
    name      = "gateway-ip-config"
    subnet_id = var.subnet_id
  }

  # Frontend ports
  frontend_port {
    name = "http-port"
    port = 80
  }

  frontend_port {
    name = "https-port"
    port = 443
  }

  # Frontend IP configuration
  frontend_ip_configuration {
    name                 = "frontend-ip"
    public_ip_address_id = azurerm_public_ip.appgw.id
  }

  # Backend address pool
  backend_address_pool {
    name = "backend-pool"
  }

  # Backend HTTP settings
  backend_http_settings {
    name                  = "http-settings"
    cookie_based_affinity = "Disabled"
    port                  = 80
    protocol              = "Http"
    request_timeout       = var.request_timeout

    probe_name = "health-probe"
  }

  # Health probe
  probe {
    name                = "health-probe"
    protocol            = "Http"
    path                = var.health_probe_path
    host                = var.health_probe_host != "" ? var.health_probe_host : "127.0.0.1"
    interval            = var.health_probe_interval
    timeout             = var.health_probe_timeout
    unhealthy_threshold = var.health_probe_unhealthy_threshold

    match {
      status_code = ["200-399"]
    }
  }

  # HTTP listener
  http_listener {
    name                           = "http-listener"
    frontend_ip_configuration_name = "frontend-ip"
    frontend_port_name             = "http-port"
    protocol                       = "Http"
  }

  # Request routing rule
  request_routing_rule {
    name                       = "http-rule"
    rule_type                  = "Basic"
    http_listener_name         = "http-listener"
    backend_address_pool_name  = "backend-pool"
    backend_http_settings_name = "http-settings"
    priority                   = 100
  }

  # WAF configuration (if enabled)
  dynamic "waf_configuration" {
    for_each = var.enable_waf ? [1] : []
    content {
      enabled          = true
      firewall_mode    = var.waf_mode
      rule_set_type    = "OWASP"
      rule_set_version = var.waf_rule_set_version

      dynamic "disabled_rule_group" {
        for_each = var.waf_disabled_rule_groups
        content {
          rule_group_name = disabled_rule_group.value.rule_group_name
          rules           = disabled_rule_group.value.rules
        }
      }
    }
  }

  # Identity (for Key Vault access)
  identity {
    type = "SystemAssigned"
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      backend_address_pool,
      backend_http_settings,
      http_listener,
      probe,
      request_routing_rule,
      redirect_configuration,
      url_path_map,
    ]
  }
}
