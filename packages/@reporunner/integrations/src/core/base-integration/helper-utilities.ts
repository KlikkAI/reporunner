/**
 * Abstract method for integration-specific heartbeat
 */
protected
abstract;
onHeartbeat();
: Promise<void>

/**
 * Suspend integration
 */
suspend()
: void
{
  this.stopHeartbeat();
  this.setState('suspended');

  this.emit('suspended', {
    name: this.config.name,
    errorCount: this.state.errorCount,
  });
}

/**
 * Resume integration
 */
async;
resume();
: Promise<void>
{
  this.state.errorCount = 0;
  await this.connect();
}

/**
 * Get configuration
 */
getConfig();
: IntegrationConfig
{
  return { ...this.config };
}

/**
 * Get state
 */
getState();
: IntegrationState
{
  return { ...this.state };
}

/**
 * Get context
 */
getContext();
: IntegrationContext | undefined
{
  return this.context ? { ...this.context } : undefined;
}

/**
 * Update settings
 */
async;
updateSettings(settings: Record<string, any>)
: Promise<void>
{
  if (!this.context) {
    throw new Error('Integration not initialized');
  }

  this.context.settings = {
    ...this.context.settings,
    ...settings,
  };

  await this.onSettingsUpdate(settings);

  this.emit('settings:updated', {
    name: this.config.name,
    settings,
  });
}

/**
 * Abstract method for integration-specific settings update
 */
protected
abstract;
onSettingsUpdate(settings: Record<string, any>)
: Promise<void>

/**
 * Get capabilities
 */
getCapabilities()
: string[]
{
  return this.config.supportedFeatures || [];
}

/**
 * Check if capability is supported
 */
hasCapability(capability: string)
: boolean
{
  return this.getCapabilities().includes(capability);
}

/**
 * Get metadata
 */
getMetadata();
: Record<string, any>
{
    return {
      name: this.config.name,
      version: this.config.version,
      description: this.config.description,
      icon: this.config.icon,
      category: this.config.category,
      tags: this.config.tags,
      author: this.config.author,
      documentation: this.config.documentation,
