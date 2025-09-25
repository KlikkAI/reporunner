// Metrics collection
this.app.use(this.metricsCollector.middleware());

// Global rate limiting
const globalLimiter = rateLimit({
  store: new RedisStore({
    client: this.redisClient,
    prefix: 'global_limit:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});
this.app.use(globalLimiter);
}

  private registerServices(): void
{
  // Register microservices
  const services: ServiceConfig[] = [
    {
      name: 'tenant-service',
      path: '/api/v1/tenants',
      healthCheck: '/health',
      timeout: 30000,
      retries: 3,
      auth: true,
      circuitBreaker: {
        threshold: 5,
        timeout: 60000,
        resetTimeout: 30000,
      },
      rateLimit: {
        windowMs: 60000,
        max: 100,
      },
    },
    {
      name: 'workflow-service',
      path: '/api/v1/workflows',
      healthCheck: '/health',
      timeout: 30000,
      retries: 3,
      auth: true,
      cache: {
        ttl: 300,
        key: (req) => `workflow:${req.params.id || 'list'}`,
      },
    },
    {
      name: 'execution-service',
      path: '/api/v1/executions',
      healthCheck: '/health',
      timeout: 120000, // Longer timeout for executions
      retries: 1,
      auth: true,
    },
    {
      name: 'notification-service',
      path: '/api/v1/notifications',
      healthCheck: '/health',
      timeout: 10000,
      retries: 3,
      auth: true,
    },
    {
      name: 'analytics-service',
      path: '/api/v1/analytics',
      healthCheck: '/health',
      timeout: 60000,
      retries: 2,
      auth: true,
      cache: {
        ttl: 600,
        key: (req) => `analytics:${req.query.metric || 'default'}`,
      },
    },
    {
      name: 'audit-service',
      path: '/api/v1/audit',
      healthCheck: '/health',
      timeout: 30000,
      retries: 2,
      auth: true,
    },
  ];

  services.forEach((service) => {
    this.services.set(service.name, service);
    this.setupServiceProxy(service);
  });
}

private
setupServiceProxy(service: ServiceConfig)
: void
{
    // Create circuit breaker for service
    if (service.circuitBreaker) {
      this.circuitBreakers.set(
        service.name,
        new CircuitBreaker(service.name, service.circuitBreaker)
