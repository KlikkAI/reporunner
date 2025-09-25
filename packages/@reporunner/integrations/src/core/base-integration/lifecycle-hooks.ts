this.startHeartbeat();

this.setState('connected');
this.emit('initialized', { name: this.config.name });
} catch (error: any)
{
  this.handleError(error);
  throw error;
}
}

  /**
   * Abstract method for integration-specific initialization
   */
  protected
abstract;
onInitialize();
: Promise<void>

/**
 * Connect to the service
 */
async
connect();
: Promise<void>
{
  try {
    this.setState('initializing');

    // Call abstract connect method
    await this.onConnect();

    this.setState('connected');
    this.retryCount = 0;
    this.emit('connected', { name: this.config.name });
  } catch (error: any) {
    this.handleError(error);

    // Retry logic
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      const delay = 2 ** this.retryCount * 1000;

      this.emit('retry', {
        name: this.config.name,
        attempt: this.retryCount,
        delay,
      });

      setTimeout(() => this.connect(), delay);
    } else {
      throw error;
    }
  }
}

/**
 * Abstract method for integration-specific connection
 */
protected
abstract;
onConnect();
: Promise<void>

/**
 * Disconnect from the service
 */
async
disconnect();
: Promise<void>
{
  try {
    // Stop heartbeat
    this.stopHeartbeat();

    // Call abstract disconnect method
    await this.onDisconnect();

    this.setState('disconnected');
    this.emit('disconnected', { name: this.config.name });
  } catch (error: any) {
    this.handleError(error);
    throw error;
  }
}

/**
 * Abstract method for integration-specific disconnection
 */
protected
abstract;
onDisconnect();
: Promise<void>

/**
 * Validate configuration
 */
protected
async
validateConfiguration();
: Promise<void>
{
  // Check required credentials
  if (this.config.requiredCredentials && this.config.requiredCredentials.length > 0) {
    for (const credentialName of this.config.requiredCredentials) {
      const hasCredential = await this.checkCredential(credentialName);
      if (!hasCredential) {
        throw new Error(`Missing required credential: ${credentialName}`);
      }
    }
  }

  // Call abstract validation method
  await this.onValidateConfiguration();
}

/**
 * Abstract method for integration-specific configuration validation
 */
protected
abstract;
onValidateConfiguration();
: Promise<void>
