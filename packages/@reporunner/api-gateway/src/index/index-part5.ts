services: {
}
,
    }

for (const [name, service] of this.services) {
  try {
    const instances = await this.serviceRegistry.getServiceInstances(name);
    const healthyInstances = instances.filter((i) => i.status === 'healthy');

    health.services[name] = {
      healthy: healthyInstances.length,
      total: instances.length,
      status: healthyInstances.length > 0 ? 'up' : 'down',
    };

    if (healthyInstances.length === 0) {
      health.status = 'degraded';
    }
  } catch (error) {
    health.services[name] = {
      status: 'unknown',
      error: error.message,
    };
    health.status = 'degraded';
  }
}

return health;
}

  async start(port: number = 3000): Promise<void>
{
  // Initialize service registry
  await this.serviceRegistry.connect();

  // Start health check monitoring
  setInterval(async () => {
    await this.monitorServices();
  }, 30000); // Check every 30 seconds

  // Start server
  this.app.listen(port, () => {
    logger.info(`API Gateway listening on port ${port}`);
  });
}

private
async;
monitorServices();
: Promise<void>
{
  for (const [name, service] of this.services) {
    try {
      const instances = await this.serviceRegistry.getServiceInstances(name);
      logger.debug(`Service ${name}: ${instances.length} instances`);
    } catch (error) {
      logger.error(`Failed to monitor service ${name}`, error);
    }
  }
}
}

// Start the API Gateway
if (require.main === module) {
  const gateway = new APIGateway();
  const port = parseInt(process.env.GATEWAY_PORT || '3000');

  gateway.start(port).catch((error) => {
    logger.error('Failed to start API Gateway', error);
    process.exit(1);
  });
}

export default APIGateway;
