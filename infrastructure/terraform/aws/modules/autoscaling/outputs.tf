/**
 * Auto Scaling Module Outputs
 */

output "autoscaling_target_id" {
  description = "Auto scaling target ID"
  value       = aws_appautoscaling_target.main.id
}

output "cpu_policy_arn" {
  description = "CPU scaling policy ARN"
  value       = aws_appautoscaling_policy.cpu.arn
}

output "memory_policy_arn" {
  description = "Memory scaling policy ARN"
  value       = aws_appautoscaling_policy.memory.arn
}

output "request_count_policy_arn" {
  description = "Request count scaling policy ARN (if enabled)"
  value       = var.target_group_arn != null ? aws_appautoscaling_policy.request_count[0].arn : null
}
