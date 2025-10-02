# Azure VNet Module Variables

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

variable "address_space" {
  description = "Address space for VNet"
  type        = list(string)
}

variable "subnet_cidrs" {
  description = "CIDR blocks for subnets"
  type = object({
    aks      = list(string)
    database = list(string)
    appgw    = list(string)
  })
}

variable "enable_nat_gateway" {
  description = "Enable NAT Gateway for outbound connectivity"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
