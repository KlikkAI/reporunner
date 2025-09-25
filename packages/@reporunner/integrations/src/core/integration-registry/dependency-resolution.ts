const instanceId = this.generateInstanceId();

// Store instance
const instance: IntegrationInstance = {
  id: instanceId,
  definition,
  integration,
  context,
  createdAt: new Date(),
};

this.instances.set(instanceId, instance);

// Set up event listeners
this.setupInstanceListeners(instanceId, integration);

this.emit('instance:created', {
  id: instanceId,
  name: definition.name,
  userId: context.userId,
});

return instanceId;
} catch (error: any)
{
  this.emit('instance:creation_failed', {
    name,
    error: error.message,
  });
  throw error;
}
}

  /**
   * Setup instance event listeners
   */
  private setupInstanceListeners(instanceId: string, integration: BaseIntegration): void
{
  // Forward integration events
  integration.on('state:changed', (data) => {
    this.emit('instance:state_changed', { instanceId, ...data });
  });

  integration.on('error', (data) => {
    this.emit('instance:error', { instanceId, ...data });
  });

  integration.on('action:executed', (data) => {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.lastActivity = new Date();
    }
    this.emit('instance:action_executed', { instanceId, ...data });
  });
}

/**
 * Get integration instance
 */
getInstance(instanceId: string)
: IntegrationInstance | undefined
{
  return this.instances.get(instanceId);
}

/**
 * Get all instances
 */
getAllInstances();
: IntegrationInstance[]
{
  return Array.from(this.instances.values());
}

/**
 * Get instances by integration name
 */
getInstancesByName(name: string)
: IntegrationInstance[]
{
  return Array.from(this.instances.values()).filter(
      (instance) => instance.definition.name === name
    );
}

/**
 * Get instances by user
 */
getInstancesByUser(userId: string)
: IntegrationInstance[]
{
  return Array.from(this.instances.values()).filter(
      (instance) => instance.context.userId === userId
    );
}

/**
 * Execute action on instance
 */
async;
executeAction(instanceId: string, action: string, params: any)
: Promise<any>
{
    const instance = this.instances.get(instanceId);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    try {
      const result = await instance.integration.execute(action, params);

      this.emit('instance:action_executed', {
        instanceId,
