# Azure Kubernetes Service Module

# AKS Cluster
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.name_prefix}-aks"
  location            = var.location
  resource_group_name = var.resource_group_name
  dns_prefix          = var.name_prefix
  kubernetes_version  = var.kubernetes_version

  # Node pool configuration
  default_node_pool {
    name                = "default"
    node_count          = var.node_count
    vm_size             = var.vm_size
    os_disk_size_gb     = var.os_disk_size_gb
    vnet_subnet_id      = var.subnet_id
    enable_auto_scaling = var.enable_auto_scaling
    min_count           = var.enable_auto_scaling ? var.min_count : null
    max_count           = var.enable_auto_scaling ? var.max_count : null
    max_pods            = var.max_pods_per_node
    zones               = var.availability_zones

    # Node labels
    node_labels = var.node_labels

    # Node taints
    node_taints = var.node_taints

    upgrade_settings {
      max_surge = "33%"
    }
  }

  # Identity
  identity {
    type = "SystemAssigned"
  }

  # Network profile
  network_profile {
    network_plugin    = var.network_plugin
    network_policy    = var.network_policy
    dns_service_ip    = var.dns_service_ip
    service_cidr      = var.service_cidr
    load_balancer_sku = "standard"

    # Load balancer profile
    load_balancer_profile {
      managed_outbound_ip_count = var.outbound_ip_count
    }
  }

  # Azure AD integration
  dynamic "azure_active_directory_role_based_access_control" {
    for_each = var.enable_azure_ad_rbac ? [1] : []
    content {
      managed                = true
      azure_rbac_enabled     = true
      admin_group_object_ids = var.admin_group_object_ids
    }
  }

  # Auto-scaler profile
  auto_scaler_profile {
    balance_similar_node_groups      = true
    max_graceful_termination_sec     = 600
    scale_down_delay_after_add       = "10m"
    scale_down_unneeded              = "10m"
    scale_down_unready               = "20m"
    scale_down_utilization_threshold = "0.5"
  }

  # Azure Policy
  dynamic "azure_policy_enabled" {
    for_each = var.enable_azure_policy ? [true] : []
    content {
    }
  }

  # Enable private cluster
  private_cluster_enabled = var.enable_private_cluster

  # Workload identity
  oidc_issuer_enabled       = true
  workload_identity_enabled = true

  # Monitoring
  dynamic "oms_agent" {
    for_each = var.log_analytics_workspace_id != "" ? [1] : []
    content {
      log_analytics_workspace_id = var.log_analytics_workspace_id
    }
  }

  # Key Vault secrets provider
  key_vault_secrets_provider {
    secret_rotation_enabled  = true
    secret_rotation_interval = "2m"
  }

  # Maintenance window
  maintenance_window {
    allowed {
      day   = var.maintenance_window_day
      hours = [var.maintenance_window_hour]
    }
  }

  tags = var.tags

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count,
    ]
  }
}

# Additional node pool for workloads (optional)
resource "azurerm_kubernetes_cluster_node_pool" "workload" {
  count = var.create_workload_node_pool ? 1 : 0

  name                  = "workload"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = var.workload_vm_size
  node_count            = var.workload_node_count
  enable_auto_scaling   = var.enable_auto_scaling
  min_count             = var.enable_auto_scaling ? var.workload_min_count : null
  max_count             = var.enable_auto_scaling ? var.workload_max_count : null
  vnet_subnet_id        = var.subnet_id
  zones                 = var.availability_zones
  node_labels = merge(
    var.node_labels,
    {
      "workload" = "true"
    }
  )

  upgrade_settings {
    max_surge = "33%"
  }

  tags = var.tags
}

# Role assignment for AKS to manage VNet
resource "azurerm_role_assignment" "aks_network_contributor" {
  scope                = var.vnet_id
  role_definition_name = "Network Contributor"
  principal_id         = azurerm_kubernetes_cluster.main.identity[0].principal_id
}

# User-assigned managed identity for workload identity
resource "azurerm_user_assigned_identity" "workload" {
  name                = "${var.name_prefix}-aks-workload-identity"
  location            = var.location
  resource_group_name = var.resource_group_name

  tags = var.tags
}

# Federated identity credential for workload identity
resource "azurerm_federated_identity_credential" "workload" {
  name                = "${var.name_prefix}-federated-identity"
  resource_group_name = var.resource_group_name
  parent_id           = azurerm_user_assigned_identity.workload.id
  audience            = ["api://AzureADTokenExchange"]
  issuer              = azurerm_kubernetes_cluster.main.oidc_issuer_url
  subject             = "system:serviceaccount:${var.workload_identity_namespace}:reporunner-backend"
}
