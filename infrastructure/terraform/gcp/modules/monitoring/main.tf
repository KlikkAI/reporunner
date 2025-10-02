# Monitoring Module

# Notification channel for alerts
resource "google_monitoring_notification_channel" "email" {
  count = var.alert_email != "" ? 1 : 0

  display_name = "${var.name_prefix} Email Alerts"
  type         = "email"
  project      = var.project_id

  labels = {
    email_address = var.alert_email
  }
}

# Notification channel for PagerDuty (if configured)
resource "google_monitoring_notification_channel" "pagerduty" {
  count = var.pagerduty_service_key != "" ? 1 : 0

  display_name = "${var.name_prefix} PagerDuty"
  type         = "pagerduty"
  project      = var.project_id

  labels = {
    service_key = var.pagerduty_service_key
  }
  sensitive_labels {
    auth_token = var.pagerduty_service_key
  }
}

# Uptime check for application
resource "google_monitoring_uptime_check_config" "app_uptime" {
  count = var.create_uptime_checks ? 1 : 0

  display_name = "${var.name_prefix} Application Uptime"
  timeout      = "10s"
  period       = "60s"
  project      = var.project_id

  http_check {
    path         = var.uptime_check_path
    port         = var.uptime_check_port
    use_ssl      = var.uptime_check_use_ssl
    validate_ssl = var.uptime_check_validate_ssl
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = var.uptime_check_host
    }
  }
}

# Alert policy for uptime check
resource "google_monitoring_alert_policy" "uptime" {
  count = var.create_uptime_checks && (var.alert_email != "" || var.pagerduty_service_key != "") ? 1 : 0

  display_name = "${var.name_prefix} Uptime Alert"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Uptime check failed"
    condition_threshold {
      filter          = "metric.type=\"monitoring.googleapis.com/uptime_check/check_passed\" AND resource.type=\"uptime_url\" AND metric.label.check_id=\"${google_monitoring_uptime_check_config.app_uptime[0].uptime_check_id}\""
      duration        = "300s"
      comparison      = "COMPARISON_LT"
      threshold_value = 1
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_FRACTION_TRUE"
      }
    }
  }

  notification_channels = concat(
    var.alert_email != "" ? [google_monitoring_notification_channel.email[0].id] : [],
    var.pagerduty_service_key != "" ? [google_monitoring_notification_channel.pagerduty[0].id] : []
  )

  alert_strategy {
    auto_close = "1800s"
  }
}

# Alert policy for GKE node CPU
resource "google_monitoring_alert_policy" "gke_cpu" {
  count = var.create_gke_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? 1 : 0

  display_name = "${var.name_prefix} GKE Node High CPU"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "GKE node CPU > 80%"
    condition_threshold {
      filter          = "resource.type=\"k8s_node\" AND metric.type=\"kubernetes.io/node/cpu/allocatable_utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = concat(
    var.alert_email != "" ? [google_monitoring_notification_channel.email[0].id] : [],
    var.pagerduty_service_key != "" ? [google_monitoring_notification_channel.pagerduty[0].id] : []
  )
}

# Alert policy for GKE node memory
resource "google_monitoring_alert_policy" "gke_memory" {
  count = var.create_gke_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? 1 : 0

  display_name = "${var.name_prefix} GKE Node High Memory"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "GKE node memory > 85%"
    condition_threshold {
      filter          = "resource.type=\"k8s_node\" AND metric.type=\"kubernetes.io/node/memory/allocatable_utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = concat(
    var.alert_email != "" ? [google_monitoring_notification_channel.email[0].id] : [],
    var.pagerduty_service_key != "" ? [google_monitoring_notification_channel.pagerduty[0].id] : []
  )
}

# Alert policy for Cloud SQL CPU
resource "google_monitoring_alert_policy" "cloudsql_cpu" {
  count = var.create_cloudsql_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? 1 : 0

  display_name = "${var.name_prefix} Cloud SQL High CPU"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Cloud SQL CPU > 80%"
    condition_threshold {
      filter          = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.8
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = concat(
    var.alert_email != "" ? [google_monitoring_notification_channel.email[0].id] : [],
    var.pagerduty_service_key != "" ? [google_monitoring_notification_channel.pagerduty[0].id] : []
  )
}

# Alert policy for Cloud SQL memory
resource "google_monitoring_alert_policy" "cloudsql_memory" {
  count = var.create_cloudsql_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? 1 : 0

  display_name = "${var.name_prefix} Cloud SQL High Memory"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Cloud SQL memory > 90%"
    condition_threshold {
      filter          = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/memory/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.9
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = concat(
    var.alert_email != "" ? [google_monitoring_notification_channel.email[0].id] : [],
    var.pagerduty_service_key != "" ? [google_monitoring_notification_channel.pagerduty[0].id] : []
  )
}

# Alert policy for Cloud SQL storage
resource "google_monitoring_alert_policy" "cloudsql_storage" {
  count = var.create_cloudsql_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? 1 : 0

  display_name = "${var.name_prefix} Cloud SQL Low Storage"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Cloud SQL storage > 85%"
    condition_threshold {
      filter          = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/disk/utilization\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = concat(
    var.alert_email != "" ? [google_monitoring_notification_channel.email[0].id] : [],
    var.pagerduty_service_key != "" ? [google_monitoring_notification_channel.pagerduty[0].id] : []
  )
}

# Alert policy for Redis memory
resource "google_monitoring_alert_policy" "redis_memory" {
  count = var.create_redis_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? 1 : 0

  display_name = "${var.name_prefix} Redis High Memory"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "Redis memory > 85%"
    condition_threshold {
      filter          = "resource.type=\"redis_instance\" AND metric.type=\"redis.googleapis.com/stats/memory/usage_ratio\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 0.85
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  notification_channels = concat(
    var.alert_email != "" ? [google_monitoring_notification_channel.email[0].id] : [],
    var.pagerduty_service_key != "" ? [google_monitoring_notification_channel.pagerduty[0].id] : []
  )
}

# Alert policy for load balancer 5xx errors
resource "google_monitoring_alert_policy" "lb_5xx_errors" {
  count = var.create_lb_alerts && (var.alert_email != "" || var.pagerduty_service_key != "") ? 1 : 0

  display_name = "${var.name_prefix} Load Balancer 5xx Errors"
  project      = var.project_id
  combiner     = "OR"

  conditions {
    display_name = "High 5xx error rate"
    condition_threshold {
      filter          = "resource.type=\"https_lb_rule\" AND metric.type=\"loadbalancing.googleapis.com/https/request_count\" AND metric.label.response_code_class=\"500\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = var.lb_5xx_error_threshold
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_RATE"
        cross_series_reducer = "REDUCE_SUM"
      }
    }
  }

  notification_channels = concat(
    var.alert_email != "" ? [google_monitoring_notification_channel.email[0].id] : [],
    var.pagerduty_service_key != "" ? [google_monitoring_notification_channel.pagerduty[0].id] : []
  )
}

# Dashboard for application monitoring
resource "google_monitoring_dashboard" "main" {
  count = var.create_dashboard ? 1 : 0

  dashboard_json = jsonencode({
    displayName = "${var.name_prefix} Monitoring Dashboard"
    mosaicLayout = {
      columns = 12
      tiles = [
        {
          width  = 6
          height = 4
          widget = {
            title = "GKE Node CPU"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"k8s_node\" AND metric.type=\"kubernetes.io/node/cpu/allocatable_utilization\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                }
              }]
            }
          }
        },
        {
          width  = 6
          height = 4
          xPos   = 6
          widget = {
            title = "GKE Node Memory"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"k8s_node\" AND metric.type=\"kubernetes.io/node/memory/allocatable_utilization\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                }
              }]
            }
          }
        },
        {
          width  = 6
          height = 4
          yPos   = 4
          widget = {
            title = "Cloud SQL CPU"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/cpu/utilization\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                }
              }]
            }
          }
        },
        {
          width  = 6
          height = 4
          xPos   = 6
          yPos   = 4
          widget = {
            title = "Cloud SQL Memory"
            xyChart = {
              dataSets = [{
                timeSeriesQuery = {
                  timeSeriesFilter = {
                    filter = "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/memory/utilization\""
                    aggregation = {
                      alignmentPeriod  = "60s"
                      perSeriesAligner = "ALIGN_MEAN"
                    }
                  }
                }
              }]
            }
          }
        }
      ]
    }
  })

  project = var.project_id
}
