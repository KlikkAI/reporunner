)
} else
{
  // Request setup error
  logger.error('API Client Error', error instanceof Error ? error : new Error(String(error)));

  return Promise.reject(new ApiClientError('Request failed', 0, 'CLIENT_ERROR', error));
}
}
    )
}

  /**
   * Handle authentication errors (token expiry, etc.)
   */
  private handleAuthenticationError(): void
{
  // Clear stored tokens
  localStorage.removeItem(this.config.auth.tokenKey);
  const refreshTokenKey = this.config.auth.refreshTokenKey || 'refresh_token';
  localStorage.removeItem(refreshTokenKey);

  // Log the authentication failure
  logger.warn('Authentication token expired or invalid', {
    timestamp: new Date().toISOString(),
    action: 'tokens_cleared',
  });

  // Don't force redirect here - let the application handle it
  // The calling code can check for 401 errors and redirect as needed
}

/**
 * Sanitize headers for logging (remove sensitive data)
 */
private
sanitizeHeaders(headers: Record<string, unknown>)
: Record<string, unknown>
{
  const sanitized = { ...headers };
  if (sanitized.Authorization) {
    sanitized.Authorization = '[REDACTED]';
  }
  return sanitized;
}

/**
 * Generic GET request with schema validation
 */
async;
get<T>(
    endpoint: string,
    schema: ZodSchema<ApiResponse<T>>,
    config?: AxiosRequestConfig
  )
: Promise<T>
{
  try {
    const response = await this.client.get(endpoint, config);
    return this.validateAndExtractData(response, schema);
  } catch (error) {
    throw this.handleRequestError(error);
  }
}

/**
 * Generic POST request with schema validation
 */
async;
post<T, D = unknown>(
    endpoint
: string,
    data: D,
    schema: ZodSchema<ApiResponse<T>>,
    config?: AxiosRequestConfig
  ): Promise<T>
{
  try {
    const response = await this.client.post(endpoint, data, config);
    return this.validateAndExtractData(response, schema);
  } catch (error) {
    throw this.handleRequestError(error);
  }
}

/**
 * Generic PUT request with schema validation
 */
async;
put<T, D = unknown>(
    endpoint
: string,
    data: D,
    schema: ZodSchema<ApiResponse<T>>,
    config?: AxiosRequestConfig
  ): Promise<T>
{
  try {
    const response = await this.client.put(endpoint, data, config);
    return this.validateAndExtractData(response, schema);
  } catch (error) {
    throw this.handleRequestError(error);
  }
}

/**
 * Generic PATCH request with schema validation
 */
async;
patch<T, D = unknown>(
    endpoint
: string,
    data: D,
