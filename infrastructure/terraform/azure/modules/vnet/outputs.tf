# Azure VNet Module Outputs

output "vnet_id" {
  description = "Virtual network ID"
  value       = azurerm_virtual_network.main.id
}

output "vnet_name" {
  description = "Virtual network name"
  value       = azurerm_virtual_network.main.name
}

output "aks_subnet_id" {
  description = "AKS subnet ID"
  value       = azurerm_subnet.aks.id
}

output "aks_subnet_name" {
  description = "AKS subnet name"
  value       = azurerm_subnet.aks.name
}

output "database_subnet_id" {
  description = "Database subnet ID"
  value       = azurerm_subnet.database.id
}

output "database_subnet_name" {
  description = "Database subnet name"
  value       = azurerm_subnet.database.name
}

output "appgw_subnet_id" {
  description = "Application Gateway subnet ID"
  value       = azurerm_subnet.appgw.id
}

output "appgw_subnet_name" {
  description = "Application Gateway subnet name"
  value       = azurerm_subnet.appgw.name
}

output "aks_nsg_id" {
  description = "AKS network security group ID"
  value       = azurerm_network_security_group.aks.id
}

output "database_nsg_id" {
  description = "Database network security group ID"
  value       = azurerm_network_security_group.database.id
}

output "appgw_nsg_id" {
  description = "Application Gateway network security group ID"
  value       = azurerm_network_security_group.appgw.id
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = var.enable_nat_gateway ? azurerm_nat_gateway.main[0].id : null
}

output "nat_public_ip" {
  description = "NAT Gateway public IP"
  value       = var.enable_nat_gateway ? azurerm_public_ip.nat[0].ip_address : null
}
