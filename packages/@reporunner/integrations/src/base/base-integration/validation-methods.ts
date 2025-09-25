delay: number = 1000;
): Promise<T>
{
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (!error.retryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff
      const waitTime = delay * 2 ** attempt;
      await this.sleep(waitTime);
    }
  }

  throw lastError;
}

/**
 * Check rate limits
 */
private
async;
checkRateLimit();
: Promise<void>
{
  if (!this.config.rateLimit) {
    return;
  }

  const now = Date.now();
  const periodMs = this.config.rateLimit.period * 1000;

  // Reset counter if period has passed
  if (now - this.requestResetTime > periodMs) {
    this.requestCount = 0;
    this.requestResetTime = now;
  }

  // Check if limit exceeded
  if (this.requestCount >= this.config.rateLimit.requests) {
    const waitTime = periodMs - (now - this.requestResetTime);
    throw this.createError(
      'RATE_LIMIT_EXCEEDED',
      `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
      429
    );
  }
}

/**
 * Increment request counter
 */
private
incrementRequestCount();
: void
{
  this.requestCount++;
}

/**
 * Create an integration error
 */
protected
createError(
    code: string,
    message: string,
    statusCode?: number,
    details?: any
  )
: IntegrationError
{
  const error = new Error(message) as IntegrationError;
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  error.name = 'IntegrationError';
  return error;
}

/**
 * Sleep utility
 */
private
sleep(ms: number)
: Promise<void>
{
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get integration metadata
 */
getMetadata();
: IntegrationConfig
{
  return this.config;
}

/**
 * Clean up resources
 */
async;
cleanup();
: Promise<void>
{
  this.removeAllListeners();
  this.context = undefined;
  this.credentials = undefined;
}
}

export interface IntegrationAction {
