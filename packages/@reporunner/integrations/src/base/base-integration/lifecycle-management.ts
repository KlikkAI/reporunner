/**
 * Get available triggers for this integration
 */
abstract;
getTriggers();
: Promise<IntegrationTrigger[]>

/**
 * Execute an action
 */
abstract;
executeAction(actionName: string, parameters: any)
: Promise<any>

/**
 * Make an authenticated request to the integration
 */
protected
async
makeRequest(endpoint: string, options: RequestOptions = {})
: Promise<any>
{
  // Check rate limits
  await this.checkRateLimit();

  // Build full URL
  const url = this.buildUrl(endpoint, options.queryParams);

  // Add authentication headers
  const headers = await this.getAuthHeaders(options.headers);

  // Make the request with retries
  const response = await this.executeWithRetry(
    async () => {
      return this.performRequest(url, {
        ...options,
        headers,
      });
    },
    options.retryCount || 3,
    options.retryDelay || 1000
  );

  // Update rate limit counters
  this.incrementRequestCount();

  return response;
}

/**
 * Build full URL with query parameters
 */
private
buildUrl(endpoint: string, queryParams?: Record<string, any>)
: string
{
  const baseUrl = this.config.baseUrl || '';
  let url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;

  if (queryParams) {
    const params = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const queryString = params.toString();
    if (queryString) {
      url += `${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  return url;
}

/**
 * Get authentication headers based on auth type
 */
protected
async;
getAuthHeaders(
    additionalHeaders?: Record<string, string>
  )
: Promise<Record<string, string>>
{
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    };

    if (!this.credentials) {
      return headers;
    }

    switch (this.config.authType) {
      case 'apiKey':
        headers.Authorization = `Bearer ${this.credentials.data.apiKey}`;
        break;

      case 'oauth2':
        // Check if token needs refresh
        if (this.credentials.expiresAt && new Date() >= this.credentials.expiresAt) {
          await this.refreshOAuth2Token();
        }
        headers.Authorization = `Bearer ${this.credentials.data.accessToken}`;
        break;

      case 'basic': {
        const auth = Buffer.from(
          `${this.credentials.data.username}:${this.credentials.data.password}`
        ).toString('base64');
        headers.Authorization = `Basic ${auth}`;
        break;
      }
