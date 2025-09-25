hasData: !!config.data, headers;
: this.sanitizeHeaders(config.headers),
          })
}

return config;
},
      (error) =>
{
  logger.error(
    'API Request Setup Failed',
    error instanceof Error ? error : new Error(String(error))
  );
  return Promise.reject(
          new ApiClientError('Request setup failed', 0, 'REQUEST_SETUP_ERROR', error)
        );
}
)

// Response interceptor
this.client.interceptors.response.use(
      (response) =>
{
  const context = (response.config as any).metadata?.context as RequestContext;
  if (context) {
    const duration = Date.now() - context.startTime;

    // Log successful response
    if (this.config.features.enableDebug) {
      logger.info('API Response Success', {
        method: context.method,
        endpoint: context.endpoint,
        status: response.status,
        duration,
        dataSize: JSON.stringify(response.data || {}).length,
      });
    }

    // Track performance
    if (duration > 5000) {
      // Warn on slow requests (>5s)
      logger.warn('Slow API Response', {
        method: context.method,
        endpoint: context.endpoint,
        duration,
        status: response.status,
      });
    }
  }

  return response;
}
,
      (error: AxiosError) =>
{
        const context = (error.config as any)?.metadata?.context as RequestContext;
        const duration = context ? Date.now() - context.startTime : 0;

        // Handle different error types
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const errorData = error.response.data as any;

          // Handle authentication errors
          if (status === 401) {
            this.handleAuthenticationError();
          }

          // Log the error
          const logError = new Error(error.message);
          logger.error('API Response Error', logError);
          logger.info('API Error Details', {
            endpoint: context?.endpoint || 'UNKNOWN',
            status,
            duration,
            errorData,
          });

          // Create structured error
          const apiError = new ApiClientError(
            errorData?.message || error.message || 'Server error',
            status,
            errorData?.code || 'SERVER_ERROR',
            errorData
          );

          return Promise.reject(apiError);
        } else if (error.request) {
          // Network error
          const networkError = new Error(error.message);
          logger.error('API Network Error', networkError);
          logger.info('Network Error Details', {
            endpoint: context?.endpoint || 'UNKNOWN',
            duration,
          });

          return Promise.reject(
            new ApiClientError(
              'Network error - please check your connection',
              0,
              'NETWORK_ERROR',
              error
            )
