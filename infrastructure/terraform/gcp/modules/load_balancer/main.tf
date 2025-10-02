# Load Balancer Module

# Global static IP address
resource "google_compute_global_address" "default" {
  name    = "${var.name_prefix}-lb-ip"
  project = var.project_id
}

# SSL certificate (if HTTPS enabled)
resource "google_compute_managed_ssl_certificate" "default" {
  count = var.enable_https && var.ssl_certificate_domains != null ? 1 : 0

  name    = "${var.name_prefix}-ssl-cert"
  project = var.project_id

  managed {
    domains = var.ssl_certificate_domains
  }
}

# Backend service for GKE
resource "google_compute_backend_service" "default" {
  name                  = "${var.name_prefix}-backend"
  project               = var.project_id
  protocol              = var.enable_https ? "HTTPS" : "HTTP"
  port_name             = var.enable_https ? "https" : "http"
  timeout_sec           = var.backend_timeout_sec
  enable_cdn            = var.enable_cdn
  health_checks         = [google_compute_health_check.default.id]
  load_balancing_scheme = "EXTERNAL_MANAGED"

  # CDN configuration
  dynamic "cdn_policy" {
    for_each = var.enable_cdn ? [1] : []
    content {
      cache_mode                   = "CACHE_ALL_STATIC"
      client_ttl                   = 3600
      default_ttl                  = 3600
      max_ttl                      = 86400
      negative_caching             = true
      serve_while_stale            = 86400
      signed_url_cache_max_age_sec = 7200
    }
  }

  # Connection draining
  connection_draining_timeout_sec = var.connection_draining_timeout_sec

  # Session affinity
  session_affinity = var.session_affinity

  # IAP (Identity-Aware Proxy)
  dynamic "iap" {
    for_each = var.enable_iap ? [1] : []
    content {
      oauth2_client_id     = var.iap_oauth2_client_id
      oauth2_client_secret = var.iap_oauth2_client_secret
    }
  }

  # Cloud Armor security policy
  security_policy = var.cloud_armor_security_policy

  # Backend configuration will be added after GKE deployment
  dynamic "backend" {
    for_each = var.backend_groups
    content {
      group                 = backend.value.group
      balancing_mode        = "RATE"
      max_rate_per_instance = backend.value.max_rate_per_instance
      capacity_scaler       = backend.value.capacity_scaler
    }
  }
}

# Health check
resource "google_compute_health_check" "default" {
  name    = "${var.name_prefix}-health-check"
  project = var.project_id

  timeout_sec         = var.health_check_timeout
  check_interval_sec  = var.health_check_interval
  healthy_threshold   = var.health_check_healthy_threshold
  unhealthy_threshold = var.health_check_unhealthy_threshold

  dynamic "http_health_check" {
    for_each = !var.enable_https ? [1] : []
    content {
      port         = var.health_check_port
      request_path = var.health_check_path
    }
  }

  dynamic "https_health_check" {
    for_each = var.enable_https ? [1] : []
    content {
      port         = var.health_check_port
      request_path = var.health_check_path
    }
  }
}

# URL map
resource "google_compute_url_map" "default" {
  name            = "${var.name_prefix}-url-map"
  project         = var.project_id
  default_service = google_compute_backend_service.default.id

  # Path rules for different services
  dynamic "host_rule" {
    for_each = var.host_rules
    content {
      hosts        = host_rule.value.hosts
      path_matcher = host_rule.value.path_matcher
    }
  }

  dynamic "path_matcher" {
    for_each = var.path_matchers
    content {
      name            = path_matcher.value.name
      default_service = path_matcher.value.default_service

      dynamic "path_rule" {
        for_each = path_matcher.value.path_rules
        content {
          paths   = path_rule.value.paths
          service = path_rule.value.service
        }
      }
    }
  }
}

# HTTPS proxy (if HTTPS enabled)
resource "google_compute_target_https_proxy" "default" {
  count = var.enable_https ? 1 : 0

  name             = "${var.name_prefix}-https-proxy"
  project          = var.project_id
  url_map          = google_compute_url_map.default.id
  ssl_certificates = var.ssl_certificate_domains != null ? [google_compute_managed_ssl_certificate.default[0].id] : var.ssl_certificate_self_links
}

# HTTP proxy (if HTTPS not enabled or for redirect)
resource "google_compute_target_http_proxy" "default" {
  count = !var.enable_https || var.enable_http_to_https_redirect ? 1 : 0

  name    = "${var.name_prefix}-http-proxy"
  project = var.project_id
  url_map = var.enable_http_to_https_redirect ? google_compute_url_map.http_redirect[0].id : google_compute_url_map.default.id
}

# URL map for HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  count = var.enable_http_to_https_redirect ? 1 : 0

  name    = "${var.name_prefix}-http-redirect"
  project = var.project_id

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

# HTTPS forwarding rule
resource "google_compute_global_forwarding_rule" "https" {
  count = var.enable_https ? 1 : 0

  name                  = "${var.name_prefix}-https-forwarding-rule"
  project               = var.project_id
  ip_address            = google_compute_global_address.default.id
  ip_protocol           = "TCP"
  port_range            = "443"
  target                = google_compute_target_https_proxy.default[0].id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# HTTP forwarding rule
resource "google_compute_global_forwarding_rule" "http" {
  count = !var.enable_https || var.enable_http_to_https_redirect ? 1 : 0

  name                  = "${var.name_prefix}-http-forwarding-rule"
  project               = var.project_id
  ip_address            = google_compute_global_address.default.id
  ip_protocol           = "TCP"
  port_range            = "80"
  target                = google_compute_target_http_proxy.default[0].id
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# Cloud Armor security policy (if enabled)
resource "google_compute_security_policy" "default" {
  count = var.create_cloud_armor_policy ? 1 : 0

  name    = "${var.name_prefix}-security-policy"
  project = var.project_id

  # Default rule
  rule {
    action   = "allow"
    priority = 2147483647
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    description = "Default rule"
  }

  # Rate limiting rule
  dynamic "rule" {
    for_each = var.rate_limit_threshold > 0 ? [1] : []
    content {
      action   = "rate_based_ban"
      priority = 1000
      match {
        versioned_expr = "SRC_IPS_V1"
        config {
          src_ip_ranges = ["*"]
        }
      }
      rate_limit_options {
        conform_action = "allow"
        exceed_action  = "deny(429)"
        enforce_on_key = "IP"
        rate_limit_threshold {
          count        = var.rate_limit_threshold
          interval_sec = var.rate_limit_interval_sec
        }
        ban_duration_sec = var.rate_limit_ban_duration_sec
      }
    }
  }

  # Custom rules
  dynamic "rule" {
    for_each = var.cloud_armor_rules
    content {
      action      = rule.value.action
      priority    = rule.value.priority
      description = rule.value.description
      match {
        versioned_expr = rule.value.versioned_expr
        config {
          src_ip_ranges = rule.value.src_ip_ranges
        }
      }
    }
  }
}
