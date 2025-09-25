)
}

// Create rate limiter for service
let serviceLimiter: any;
if (service.rateLimit) {
  serviceLimiter = rateLimit({
    store: new RedisStore({
      client: this.redisClient,
      prefix: `${service.name}_limit:`,
    }),
    windowMs: service.rateLimit.windowMs,
    max: service.rateLimit.max,
    message: `Too many requests to ${service.name}`,
    keyGenerator: (req) => {
      // Rate limit per user or IP
      return req.user?.id || req.ip;
    },
  });
}

// Create proxy middleware
const proxyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get service instances from registry
        const instances = await this.serviceRegistry.getServiceInstances(service.name);
        
        if (!instances || instances.length === 0) {
          throw new Error(`No healthy instances found for ${service.name}`);
        }

        // Select instance using load balancer
        const instance = this.loadBalancer.selectInstance(service.name, instances);
        
        // Check circuit breaker
        const circuitBreaker = this.circuitBreakers.get(service.name);
        if (circuitBreaker && !circuitBreaker.canRequest()) {
          throw new Error(`Circuit breaker open for ${service.name}`);
        }

        // Check cache
        if (service.cache && req.method === 'GET') {
          const cacheKey = service.cache.key ? service.cache.key(req) : req.originalUrl;
          const cached = await this.redisClient.get(cacheKey);
          
          if (cached) {
            logger.debug(`Cache hit for ${cacheKey}`);
            res.setHeader('X-Cache', 'HIT');
            return res.json(JSON.parse(cached));
          }
        }

        // Create proxy options
        const proxyOptions: Options = {
          target: `http://${instance.address}:${instance.port}`,
          changeOrigin: true,
          timeout: service.timeout || 30000,
          proxyTimeout: service.timeout || 30000,
          onProxyReq: (proxyReq, req: any) => {
            // Add tracing headers
            proxyReq.setHeader('X-Request-ID', req.id || 'unknown');
            proxyReq.setHeader('X-Forwarded-For', req.ip);
            proxyReq.setHeader('X-Forwarded-Host', req.hostname);
            proxyReq.setHeader('X-Service-Name', service.name);
            
            // Forward user context
            if (req.user) {
              proxyReq.setHeader('X-User-ID', req.user.id);
              proxyReq.setHeader('X-Tenant-ID', req.user.tenantId);
            }
          },
          onProxyRes: async (proxyRes, req: any, res: any) => {
            // Record metrics
            this.metricsCollector.recordRequest(service.name, proxyRes.statusCode);
            
            // Update circuit breaker
            if (circuitBreaker) {
              if (proxyRes.statusCode >= 500) {
                circuitBreaker.recordFailure();
              } else {
                circuitBreaker.recordSuccess();
              }
            }
            
            // Cache successful GET responses
            if (service.cache && req.method === 'GET' && proxyRes.statusCode === 200) {
              const cacheKey = service.cache.key ? service.cache.key(req) : req.originalUrl;
              
              let body = '';
              proxyRes.on('data', (chunk) => {
                body += chunk;
              });
              
              proxyRes.on('end', async () => {
                try {
                  await this.redisClient.setex(cacheKey, service.cache!.ttl, body);
                  logger.debug(`Cached response for ${cacheKey}`);
                } catch (error) {
                  logger.error('Failed to cache response', error);
                }
