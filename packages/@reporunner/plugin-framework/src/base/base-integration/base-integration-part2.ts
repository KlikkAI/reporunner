/**
 * Test connection to the service
 */
abstract;
testConnection();
: Promise<boolean>

/**
 * Clean up resources
 */
abstract;
cleanup?(): Promise<void>;

/**
 * Set execution context
 */
setContext(context: IntegrationContext)
: void
{
  this.context = context;
}

/**
 * Get integration metadata
 */
getMetadata();
: IntegrationMetadata
{
  return this.metadata;
}

/**
 * Register a trigger
 */
protected
registerTrigger(config: TriggerConfig)
: void
{
  this.triggers.set(config.name, config);
}

/**
 * Register an action
 */
protected
registerAction(config: ActionConfig)
: void
{
  this.actions.set(config.name, config);
}

/**
 * Get available triggers
 */
getTriggers();
: TriggerConfig[]
{
  return Array.from(this.triggers.values());
}

/**
 * Get available actions
 */
getActions();
: ActionConfig[]
{
  return Array.from(this.actions.values());
}

/**
 * Execute a trigger
 */
async;
executeTrigger(triggerName: string, properties: Record<string, any>)
: Promise<any>
{
  const trigger = this.triggers.get(triggerName);
  if (!trigger) {
    throw new Error(`Trigger ${triggerName} not found`);
  }

  // Validate properties
  const validatedProps = trigger.properties.parse(properties);

  // Execute trigger implementation
  const methodName = `trigger_${triggerName}`;
  if (typeof (this as any)[methodName] !== 'function') {
    throw new Error(`Trigger implementation ${methodName} not found`);
  }

  const result = await (this as any)[methodName](validatedProps);

  // Validate output
  return trigger.outputSchema.parse(result);
}

/**
 * Execute an action
 */
async;
executeAction(
    actionName: string,
    input: Record<string, any>,
    properties: Record<string, any>
  )
: Promise<any>
{
    const action = this.actions.get(actionName);
    if (!action) {
      throw new Error(`Action ${actionName} not found`);
    }

    // Validate input and properties
    const validatedInput = action.inputSchema.parse(input);
    const validatedProps = action.properties.parse(properties);

    // Check rate limiting
    if (this.rateLimiter) {
      await this.rateLimiter.checkLimit();
    }

    // Execute action implementation
    const methodName = `action_${actionName}`;
