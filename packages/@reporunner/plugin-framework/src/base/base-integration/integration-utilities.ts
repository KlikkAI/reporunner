if (typeof (this as any)[methodName] !== 'function') {
  throw new Error(`Action implementation ${methodName} not found`);
}

const result = await (this as any)[methodName](validatedInput, validatedProps);

// Validate output
return action.outputSchema.parse(result);
}

  /**
   * Handle webhook
   */
  async handleWebhook?(
    _headers: Record<string, string>,
    _body: any,
    _query?: Record<string, string>
  ): Promise<any>
{
  throw new Error('Webhook handling not implemented');
}

/**
 * Validate webhook signature
 */
protected
validateWebhookSignature?(
    _headers: Record<string, string>,
    _body
: any,
    _secret: string
  ): boolean
{
  return false;
}

/**
 * Get required OAuth scopes
 */
getRequiredScopes?(): string[]
{
  return [];
}

/**
 * Get OAuth authorization URL
 */
getAuthorizationUrl?(_redirectUri: string, _state
: string): string
{
  throw new Error('OAuth not implemented for this integration');
}

/**
 * Exchange OAuth code for tokens
 */
async;
exchangeCodeForTokens?(
    _code: string,
    _redirectUri
: string
  ): Promise<IntegrationCredentials>
{
  throw new Error('OAuth not implemented for this integration');
}

/**
 * Log event
 */
protected
log(level: string, message: string, data?: any)
: void
{
  if (this.context?.logger) {
    this.context.logger[level](message, data);
  }
  this.emit('log', { level, message, data });
}

/**
 * Handle errors
 */
protected
handleError(error: any)
: never
{
  this.log('error', 'Integration error', {
    integration: this.metadata.name,
    error: error.message,
    stack: error.stack,
  });
  throw error;
}
}

export default BaseIntegration;
