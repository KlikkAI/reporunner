# Azure Application Gateway Module Outputs

output "app_gateway_id" {
  description = "Application Gateway ID"
  value       = azurerm_application_gateway.main.id
}

output "app_gateway_name" {
  description = "Application Gateway name"
  value       = azurerm_application_gateway.main.name
}

output "public_ip_address" {
  description = "Public IP address"
  value       = azurerm_public_ip.appgw.ip_address
}

output "public_ip_id" {
  description = "Public IP ID"
  value       = azurerm_public_ip.appgw.id
}

output "backend_address_pool_id" {
  description = "Backend address pool ID"
  value       = tolist(azurerm_application_gateway.main.backend_address_pool)[0].id
}

output "frontend_ip_configuration_id" {
  description = "Frontend IP configuration ID"
  value       = tolist(azurerm_application_gateway.main.frontend_ip_configuration)[0].id
}

output "system_assigned_identity_principal_id" {
  description = "System assigned identity principal ID"
  value       = azurerm_application_gateway.main.identity[0].principal_id
}

output "application_url" {
  description = "Application URL"
  value       = "http://${azurerm_public_ip.appgw.ip_address}"
}
