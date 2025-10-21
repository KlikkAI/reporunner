# GKE Cluster Module

resource "google_container_cluster" "primary" {
  name     = "${var.name_prefix}-gke"
  location = var.region
  project  = var.project_id

  # Autopilot or Standard mode
  enable_autopilot = var.enable_autopilot

  # Remove default node pool
  remove_default_node_pool = !var.enable_autopilot
  initial_node_count       = var.enable_autopilot ? null : 1

  # Network configuration
  network    = var.network_name
  subnetwork = var.subnet_name

  # IP allocation policy for pods and services
  ip_allocation_policy {
    cluster_secondary_range_name  = "gke-pods"
    services_secondary_range_name = "gke-services"
  }

  # Workload Identity
  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }

  # Private cluster configuration
  private_cluster_config {
    enable_private_nodes    = var.enable_private_cluster
    enable_private_endpoint = var.enable_private_endpoint
    master_ipv4_cidr_block  = var.master_ipv4_cidr_block
  }

  # Master authorized networks
  dynamic "master_authorized_networks_config" {
    for_each = length(var.master_authorized_networks) > 0 ? [1] : []
    content {
      dynamic "cidr_blocks" {
        for_each = var.master_authorized_networks
        content {
          cidr_block   = cidr_blocks.value.cidr_block
          display_name = cidr_blocks.value.display_name
        }
      }
    }
  }

  # Logging and monitoring
  logging_service    = "logging.googleapis.com/kubernetes"
  monitoring_service = "monitoring.googleapis.com/kubernetes"

  # Addons
  addons_config {
    http_load_balancing {
      disabled = false
    }
    horizontal_pod_autoscaling {
      disabled = false
    }
    network_policy_config {
      disabled = false
    }
  }

  # Network policy
  network_policy {
    enabled  = true
    provider = "PROVIDER_UNSPECIFIED"
  }

  # Maintenance window
  maintenance_policy {
    daily_maintenance_window {
      start_time = var.maintenance_window_start_time
    }
  }

  # Release channel
  release_channel {
    channel = var.release_channel
  }

  # Binary authorization
  binary_authorization {
    evaluation_mode = var.enable_binary_authorization ? "PROJECT_SINGLETON_POLICY_ENFORCE" : "DISABLED"
  }

  # Resource labels
  resource_labels = var.labels

  lifecycle {
    ignore_changes = [
      node_pool,
      initial_node_count,
    ]
  }
}

# Separately managed node pool (for Standard mode only)
resource "google_container_node_pool" "primary_nodes" {
  count = var.enable_autopilot ? 0 : 1

  name     = "${var.name_prefix}-node-pool"
  location = var.region
  cluster  = google_container_cluster.primary.name
  project  = var.project_id

  node_count = var.node_count

  # Autoscaling configuration
  autoscaling {
    min_node_count = var.min_node_count
    max_node_count = var.max_node_count
  }

  # Node configuration
  node_config {
    preemptible  = var.preemptible_nodes
    machine_type = var.machine_type
    disk_size_gb = var.disk_size_gb
    disk_type    = var.disk_type

    # OAuth scopes
    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform",
    ]

    # Workload Identity
    workload_metadata_config {
      mode = "GKE_METADATA"
    }

    # Shielded instance config
    shielded_instance_config {
      enable_secure_boot          = true
      enable_integrity_monitoring = true
    }

    # Metadata
    metadata = {
      disable-legacy-endpoints = "true"
    }

    # Labels
    labels = var.labels

    # Tags
    tags = var.node_tags
  }

  # Management
  management {
    auto_repair  = true
    auto_upgrade = true
  }

  # Upgrade settings
  upgrade_settings {
    max_surge       = 1
    max_unavailable = 0
  }
}

# Service account for workload identity
resource "google_service_account" "gke_workload" {
  account_id   = "${var.name_prefix}-gke-workload"
  display_name = "GKE Workload Identity Service Account"
  project      = var.project_id
}

# IAM binding for workload identity
resource "google_service_account_iam_binding" "workload_identity_binding" {
  service_account_id = google_service_account.gke_workload.name
  role               = "roles/iam.workloadIdentityUser"

  members = [
    "serviceAccount:${var.project_id}.svc.id.goog[${var.workload_identity_namespace}/klikkflow-backend]",
  ]
}
