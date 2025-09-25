action,
        params,
})

return result;
} catch (error: any)
{
  this.emit('instance:action_failed', {
    instanceId,
    action,
    error: error.message,
  });
  throw error;
}
}

  /**
   * Destroy integration instance
   */
  async destroyInstance(instanceId: string): Promise<boolean>
{
  const instance = this.instances.get(instanceId);
  if (!instance) {
    return false;
  }

  try {
    // Cleanup integration
    await instance.integration.cleanup();

    // Remove instance
    this.instances.delete(instanceId);

    this.emit('instance:destroyed', {
      id: instanceId,
      name: instance.definition.name,
    });

    return true;
  } catch (error: any) {
    this.emit('instance:destroy_failed', {
      id: instanceId,
      error: error.message,
    });
    throw error;
  }
}

/**
 * Suspend instance
 */
suspendInstance(instanceId: string)
: boolean
{
  const instance = this.instances.get(instanceId);
  if (!instance) {
    return false;
  }

  instance.integration.suspend();

  this.emit('instance:suspended', {
    id: instanceId,
    name: instance.definition.name,
  });

  return true;
}

/**
 * Resume instance
 */
async;
resumeInstance(instanceId: string)
: Promise<boolean>
{
  const instance = this.instances.get(instanceId);
  if (!instance) {
    return false;
  }

  await instance.integration.resume();

  this.emit('instance:resumed', {
    id: instanceId,
    name: instance.definition.name,
  });

  return true;
}

/**
 * Enable integration
 */
enableIntegration(name: string)
: boolean
{
  const definition = this.definitions.get(name);
  if (!definition) {
    return false;
  }

  definition.isEnabled = true;

  this.emit('definition:enabled', { name });

  return true;
}
