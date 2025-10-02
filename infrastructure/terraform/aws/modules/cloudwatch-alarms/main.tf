/**
 * CloudWatch Alarms Module
 * Creates comprehensive monitoring alarms for all infrastructure components
 */

# ECS Service CPU Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_cpu_high" {
  alarm_name          = "${var.name_prefix}-${var.service_name}-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.cpu_high_threshold
  alarm_description   = "ECS service CPU utilization is too high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = var.service_name
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${var.service_name}-cpu-high-alarm"
    }
  )
}

# ECS Service Memory Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_memory_high" {
  alarm_name          = "${var.name_prefix}-${var.service_name}-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.memory_high_threshold
  alarm_description   = "ECS service memory utilization is too high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = var.service_name
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${var.service_name}-memory-high-alarm"
    }
  )
}

# ECS Service Running Tasks Alarm
resource "aws_cloudwatch_metric_alarm" "ecs_running_tasks_low" {
  alarm_name          = "${var.name_prefix}-${var.service_name}-running-tasks-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RunningTaskCount"
  namespace           = "ECS/ContainerInsights"
  period              = "60"
  statistic           = "Average"
  threshold           = var.min_running_tasks
  alarm_description   = "ECS service has fewer running tasks than expected"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ClusterName = var.cluster_name
    ServiceName = var.service_name
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${var.service_name}-running-tasks-low-alarm"
    }
  )
}

# ALB Target Health Alarm (if ALB target group is provided)
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  count               = var.target_group_arn != null ? 1 : 0
  alarm_name          = "${var.name_prefix}-${var.service_name}-unhealthy-targets"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = "60"
  statistic           = "Average"
  threshold           = "0"
  alarm_description   = "ALB has unhealthy targets"
  alarm_actions       = var.alarm_actions

  dimensions = {
    TargetGroup  = split(":", var.target_group_arn)[5]
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${var.service_name}-unhealthy-targets-alarm"
    }
  )
}

# ALB Response Time Alarm
resource "aws_cloudwatch_metric_alarm" "alb_response_time_high" {
  count               = var.target_group_arn != null ? 1 : 0
  alarm_name          = "${var.name_prefix}-${var.service_name}-response-time-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.response_time_threshold
  alarm_description   = "ALB target response time is too high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    TargetGroup  = split(":", var.target_group_arn)[5]
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${var.service_name}-response-time-high-alarm"
    }
  )
}

# ALB 5XX Error Alarm
resource "aws_cloudwatch_metric_alarm" "alb_5xx_errors" {
  count               = var.target_group_arn != null ? 1 : 0
  alarm_name          = "${var.name_prefix}-${var.service_name}-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.error_5xx_threshold
  alarm_description   = "ALB is receiving too many 5XX errors"
  alarm_actions       = var.alarm_actions
  treat_missing_data  = "notBreaching"

  dimensions = {
    TargetGroup  = split(":", var.target_group_arn)[5]
    LoadBalancer = var.alb_arn_suffix
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-${var.service_name}-5xx-errors-alarm"
    }
  )
}

# RDS CPU Alarm (if RDS instance is provided)
resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  count               = var.rds_instance_id != null ? 1 : 0
  alarm_name          = "${var.name_prefix}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_cpu_threshold
  alarm_description   = "RDS CPU utilization is too high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-rds-cpu-high-alarm"
    }
  )
}

# RDS Free Storage Alarm
resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  count               = var.rds_instance_id != null ? 1 : 0
  alarm_name          = "${var.name_prefix}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = "300"
  statistic           = "Average"
  threshold           = var.rds_storage_threshold
  alarm_description   = "RDS free storage space is low"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-rds-storage-low-alarm"
    }
  )
}

# DocumentDB CPU Alarm (if DocumentDB cluster is provided)
resource "aws_cloudwatch_metric_alarm" "docdb_cpu_high" {
  count               = var.docdb_cluster_id != null ? 1 : 0
  alarm_name          = "${var.name_prefix}-docdb-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/DocDB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.docdb_cpu_threshold
  alarm_description   = "DocumentDB CPU utilization is too high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    DBClusterIdentifier = var.docdb_cluster_id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-docdb-cpu-high-alarm"
    }
  )
}

# ElastiCache CPU Alarm (if Redis cluster is provided)
resource "aws_cloudwatch_metric_alarm" "redis_cpu_high" {
  count               = var.redis_replication_group_id != null ? 1 : 0
  alarm_name          = "${var.name_prefix}-redis-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = var.redis_cpu_threshold
  alarm_description   = "Redis CPU utilization is too high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ReplicationGroupId = var.redis_replication_group_id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-redis-cpu-high-alarm"
    }
  )
}

# ElastiCache Memory Alarm
resource "aws_cloudwatch_metric_alarm" "redis_memory_high" {
  count               = var.redis_replication_group_id != null ? 1 : 0
  alarm_name          = "${var.name_prefix}-redis-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "DatabaseMemoryUsagePercentage"
  namespace           = "AWS/ElastiCache"
  period              = "300"
  statistic           = "Average"
  threshold           = var.redis_memory_threshold
  alarm_description   = "Redis memory utilization is too high"
  alarm_actions       = var.alarm_actions

  dimensions = {
    ReplicationGroupId = var.redis_replication_group_id
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-redis-memory-high-alarm"
    }
  )
}
