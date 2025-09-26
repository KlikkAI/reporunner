return {};
}

  protected getDatabase(): Db
{
  if (!this.context.database) {
    throw new Error('Database not initialized');
  }
  return this.context.database;
}

protected
getCache();
: any
{
  if (!this.context.redisClient) {
    throw new Error('Cache not initialized');
  }
  return this.context.redisClient;
}

protected
getEventBus();
: EventEmitter
{
  if (!this.context.eventBus) {
    throw new Error('Event bus not initialized');
  }
  return this.context.eventBus;
}
}
