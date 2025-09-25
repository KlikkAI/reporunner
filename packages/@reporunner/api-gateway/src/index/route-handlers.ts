})
}
            
            // Add response headers
            res.setHeader('X-Service-Name', service.name)
res.setHeader('X-Response-Time', Date.now() - req.startTime)
res.setHeader('X-Cache', 'MISS');
},
          onError: (err, req, res: any) =>
{
  logger.error(`Proxy error for ${service.name}`, err);

  // Update circuit breaker
  if (circuitBreaker) {
    circuitBreaker.recordFailure();
  }

  // Retry logic
  if (service.retries && req.retryCount < service.retries) {
    req.retryCount = (req.retryCount || 0) + 1;
    logger.info(`Retrying request to ${service.name} (attempt ${req.retryCount})`);
    return proxyMiddleware(req, res, next);
  }

  res.status(503).json({
    error: 'Service Unavailable',
    message: `Failed to reach ${service.name}`,
    service: service.name,
  });
}
,
        }

// Create and use proxy
const proxy = createProxyMiddleware(proxyOptions);
proxy(req, res, next);

} catch (error)
{
  logger.error(`Failed to proxy request to ${service.name}`, error);
  next(error);
}
}

// Setup route with middleware
const middlewares: any[] = [];

// Add auth middleware if required
if (service.auth) {
  middlewares.push(AuthMiddleware.authenticate());
}

// Add rate limiter if configured
if (serviceLimiter) {
  middlewares.push(serviceLimiter);
}

// Add proxy middleware
middlewares.push(proxyMiddleware);

// Register route
this.app.use(service.path, ...middlewares);

logger.info(`Registered service: ${service.name} at ${service.path}`);
}

  private setupRoutes(): void
{
  // Health check endpoint
  this.app.get('/health', async (req: Request, res: Response) => {
    const health = await this.checkHealth();
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
  });

  // Metrics endpoint
  this.app.get('/metrics', (req: Request, res: Response) => {
    res.json(this.metricsCollector.getMetrics());
  });

  // Service discovery endpoint
  this.app.get('/services', async (req: Request, res: Response) => {
    const services = await this.serviceRegistry.getAllServices();
    res.json(services);
  });

  // Circuit breaker status
  this.app.get('/circuit-breakers', (req: Request, res: Response) => {
    const status: any = {};
    this.circuitBreakers.forEach((cb, name) => {
      status[name] = cb.getStatus();
    });
    res.json(status);
  });
}

private
setupErrorHandling();
: void
{
  this.app.use(ErrorHandler.handle());
}

private
async;
checkHealth();
: Promise<any>
{
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
