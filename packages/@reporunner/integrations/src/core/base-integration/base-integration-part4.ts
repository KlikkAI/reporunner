if (!this.config.webhooks?.enabled) {
  throw new Error(`Webhooks not enabled for ${this.config.name}`);
}

try {
  // Call abstract webhook handler
  const result = await this.onWebhook(path, data);

  this.emit('webhook:handled', {
    name: this.config.name,
    path,
    data,
  });

  return result;
} catch (error: any) {
  this.handleError(error);
  throw error;
}
}

  /**
   * Abstract method for integration-specific webhook handling
   */
  protected
abstract;
onWebhook(path: string, data: any)
: Promise<any>

/**
 * Set state
 */
protected
setState(status: IntegrationState['status'], errorMessage?: string)
: void
{
  const previousStatus = this.state.status;
  this.state.status = status;

  if (errorMessage) {
    this.state.errorMessage = errorMessage;
  } else if (status === 'connected') {
    this.state.errorMessage = undefined;
    this.state.errorCount = 0;
  }

  if (previousStatus !== status) {
    this.emit('state:changed', {
      name: this.config.name,
      previousStatus,
      newStatus: status,
      errorMessage,
    });
  }
}

/**
 * Handle error
 */
protected
handleError(error: Error)
: void
{
  this.state.errorCount++;
  this.setState('error', error.message);

  this.emit('error', {
    name: this.config.name,
    error: error.message,
    errorCount: this.state.errorCount,
  });

  // Suspend if too many errors
  if (this.state.errorCount >= 10) {
    this.suspend();
  }
}

/**
 * Start heartbeat
 */
private
startHeartbeat();
: void
{
  if (this.heartbeatInterval) {
    return;
  }

  this.heartbeatInterval = setInterval(async () => {
    try {
      await this.onHeartbeat();
      this.emit('heartbeat', {
        name: this.config.name,
        status: this.state.status,
      });
    } catch (error: any) {
      this.handleError(error);
    }
  }, 60000); // Every minute
}

/**
 * Stop heartbeat
 */
private
stopHeartbeat();
: void
{
  if (this.heartbeatInterval) {
    clearInterval(this.heartbeatInterval);
    this.heartbeatInterval = undefined;
  }
}
