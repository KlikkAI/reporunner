/**
 * CloudWatch Alarms Module Outputs
 */

output "ecs_cpu_alarm_arn" {
  description = "ECS CPU alarm ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_cpu_high.arn
}

output "ecs_memory_alarm_arn" {
  description = "ECS memory alarm ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_memory_high.arn
}

output "ecs_running_tasks_alarm_arn" {
  description = "ECS running tasks alarm ARN"
  value       = aws_cloudwatch_metric_alarm.ecs_running_tasks_low.arn
}

output "alb_unhealthy_targets_alarm_arn" {
  description = "ALB unhealthy targets alarm ARN (if created)"
  value       = var.target_group_arn != null ? aws_cloudwatch_metric_alarm.alb_unhealthy_targets[0].arn : null
}

output "alb_response_time_alarm_arn" {
  description = "ALB response time alarm ARN (if created)"
  value       = var.target_group_arn != null ? aws_cloudwatch_metric_alarm.alb_response_time_high[0].arn : null
}

output "rds_cpu_alarm_arn" {
  description = "RDS CPU alarm ARN (if created)"
  value       = var.rds_instance_id != null ? aws_cloudwatch_metric_alarm.rds_cpu_high[0].arn : null
}

output "redis_cpu_alarm_arn" {
  description = "Redis CPU alarm ARN (if created)"
  value       = var.redis_replication_group_id != null ? aws_cloudwatch_metric_alarm.redis_cpu_high[0].arn : null
}
