case 'custom':
        // Let the specific integration handle custom auth
        await this.applyCustomAuth(headers)
break;
}

return headers;
}

  /**
   * Apply custom authentication (to be overridden if needed)
   */
  protected async applyCustomAuth(_headers: Record<string, string>): Promise<void>
{
  // Default implementation - does nothing
  // Override in specific integrations for custom auth
}

/**
 * Refresh OAuth2 token
 */
protected
async;
refreshOAuth2Token();
: Promise<void>
{
  if (!this.credentials?.refreshToken) {
    throw this.createError('TOKEN_REFRESH_FAILED', 'No refresh token available');
  }

  // This should be implemented by OAuth2-based integrations
  throw this.createError('NOT_IMPLEMENTED', 'Token refresh not implemented');
}

/**
 * Perform the actual HTTP request
 */
private
async;
performRequest(url: string, options: RequestOptions)
: Promise<any>
{
  const controller = new AbortController();
  const timeout = options.timeout || 30000;

  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw await this.handleResponseError(response);
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  } catch (error: any) {
    clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw this.createError('TIMEOUT', `Request timed out after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Handle HTTP response errors
 */
private
async;
handleResponseError(response: Response)
: Promise<IntegrationError>
{
  let errorBody: any;

  try {
    errorBody = await response.json();
  } catch {
    errorBody = await response.text();
  }

  const error = this.createError(
    `HTTP_${response.status}`,
    errorBody?.message || `Request failed with status ${response.status}`,
    response.status,
    errorBody
  );

  // Determine if error is retryable
  error.retryable = [408, 429, 500, 502, 503, 504].includes(response.status);

  return error;
}

/**
 * Execute function with retry logic
 */
private
async;
executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
