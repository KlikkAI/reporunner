/**
 * Auto Scaling Module
 * Creates Application Auto Scaling policies for ECS services
 */

# Auto Scaling Target
resource "aws_appautoscaling_target" "main" {
  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${var.cluster_name}/${var.service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${var.service_name}-autoscaling-target"
    }
  )
}

# CPU-based Auto Scaling Policy
resource "aws_appautoscaling_policy" "cpu" {
  name               = "${var.name_prefix}-${var.service_name}-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main.resource_id
  scalable_dimension = aws_appautoscaling_target.main.scalable_dimension
  service_namespace  = aws_appautoscaling_target.main.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.cpu_target_value
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# Memory-based Auto Scaling Policy
resource "aws_appautoscaling_policy" "memory" {
  name               = "${var.name_prefix}-${var.service_name}-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main.resource_id
  scalable_dimension = aws_appautoscaling_target.main.scalable_dimension
  service_namespace  = aws_appautoscaling_target.main.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.memory_target_value
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
  }
}

# Request Count-based Auto Scaling Policy (for services with ALB)
resource "aws_appautoscaling_policy" "request_count" {
  count              = var.target_group_arn != null ? 1 : 0
  name               = "${var.name_prefix}-${var.service_name}-request-count-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.main.resource_id
  scalable_dimension = aws_appautoscaling_target.main.scalable_dimension
  service_namespace  = aws_appautoscaling_target.main.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = var.request_count_target_value
    scale_in_cooldown  = 300
    scale_out_cooldown = 60

    predefined_metric_specification {
      predefined_metric_type = "ALBRequestCountPerTarget"
      resource_label        = "${split("/", var.alb_arn)[1]}/${split("/", var.alb_arn)[2]}/${split("/", var.alb_arn)[3]}/targetgroup/${split("/", var.target_group_arn)[1]}/${split("/", var.target_group_arn)[2]}"
    }
  }
}

# Scheduled Scaling for predictable workloads (optional)
resource "aws_appautoscaling_scheduled_action" "scale_up" {
  count              = var.enable_scheduled_scaling ? 1 : 0
  name               = "${var.name_prefix}-${var.service_name}-scale-up"
  service_namespace  = aws_appautoscaling_target.main.service_namespace
  resource_id        = aws_appautoscaling_target.main.resource_id
  scalable_dimension = aws_appautoscaling_target.main.scalable_dimension
  schedule           = var.scale_up_schedule

  scalable_target_action {
    min_capacity = var.scheduled_min_capacity
    max_capacity = var.max_capacity
  }
}

resource "aws_appautoscaling_scheduled_action" "scale_down" {
  count              = var.enable_scheduled_scaling ? 1 : 0
  name               = "${var.name_prefix}-${var.service_name}-scale-down"
  service_namespace  = aws_appautoscaling_target.main.service_namespace
  resource_id        = aws_appautoscaling_target.main.resource_id
  scalable_dimension = aws_appautoscaling_target.main.scalable_dimension
  schedule           = var.scale_down_schedule

  scalable_target_action {
    min_capacity = var.min_capacity
    max_capacity = var.max_capacity
  }
}
