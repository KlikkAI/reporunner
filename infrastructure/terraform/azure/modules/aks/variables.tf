# Azure AKS Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "node_count" {
  description = "Number of nodes"
  type        = number
  default     = 3
}

variable "vm_size" {
  description = "VM size for nodes"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "os_disk_size_gb" {
  description = "OS disk size in GB"
  type        = number
  default     = 128
}

variable "subnet_id" {
  description = "Subnet ID for AKS"
  type        = string
}

variable "vnet_id" {
  description = "VNet ID for role assignment"
  type        = string
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling"
  type        = bool
  default     = true
}

variable "min_count" {
  description = "Minimum node count for auto-scaling"
  type        = number
  default     = 1
}

variable "max_count" {
  description = "Maximum node count for auto-scaling"
  type        = number
  default     = 10
}

variable "max_pods_per_node" {
  description = "Maximum pods per node"
  type        = number
  default     = 110
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["1", "2", "3"]
}

variable "node_labels" {
  description = "Node labels"
  type        = map(string)
  default     = {}
}

variable "node_taints" {
  description = "Node taints"
  type        = list(string)
  default     = []
}

variable "network_plugin" {
  description = "Network plugin (azure or kubenet)"
  type        = string
  default     = "azure"
}

variable "network_policy" {
  description = "Network policy (azure or calico)"
  type        = string
  default     = "azure"
}

variable "dns_service_ip" {
  description = "DNS service IP"
  type        = string
  default     = "10.254.0.10"
}

variable "service_cidr" {
  description = "Service CIDR"
  type        = string
  default     = "10.254.0.0/16"
}

variable "outbound_ip_count" {
  description = "Number of managed outbound IPs"
  type        = number
  default     = 1
}

variable "enable_azure_ad_rbac" {
  description = "Enable Azure AD RBAC"
  type        = bool
  default     = false
}

variable "admin_group_object_ids" {
  description = "Azure AD admin group object IDs"
  type        = list(string)
  default     = []
}

variable "enable_azure_policy" {
  description = "Enable Azure Policy"
  type        = bool
  default     = false
}

variable "enable_private_cluster" {
  description = "Enable private cluster"
  type        = bool
  default     = false
}

variable "log_analytics_workspace_id" {
  description = "Log Analytics workspace ID for monitoring"
  type        = string
  default     = ""
}

variable "maintenance_window_day" {
  description = "Maintenance window day (Sunday, Monday, etc.)"
  type        = string
  default     = "Sunday"
}

variable "maintenance_window_hour" {
  description = "Maintenance window hour (0-23)"
  type        = number
  default     = 3
}

variable "create_workload_node_pool" {
  description = "Create additional node pool for workloads"
  type        = bool
  default     = false
}

variable "workload_vm_size" {
  description = "VM size for workload node pool"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "workload_node_count" {
  description = "Node count for workload pool"
  type        = number
  default     = 2
}

variable "workload_min_count" {
  description = "Minimum node count for workload pool"
  type        = number
  default     = 1
}

variable "workload_max_count" {
  description = "Maximum node count for workload pool"
  type        = number
  default     = 5
}

variable "workload_identity_namespace" {
  description = "Kubernetes namespace for workload identity"
  type        = string
  default     = "default"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
