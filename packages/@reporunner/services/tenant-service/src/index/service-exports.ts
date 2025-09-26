storageGB: 100, apiCallsPerMonth;
: 1000000,
        concurrent_executions: 50,
        retention_days: 365,
        custom_integrations: 25,
      },
      custom:
{
  maxUsers: 1000, maxWorkflows;
  : 2000,
        maxExecutions: 1000000,
        storageGB: 1000,
        apiCallsPerMonth: 10000000,
        concurrent_executions: 100,
        retention_days: 365,
        custom_integrations: 100,
}
,
    }

return planLimits[plan] || planLimits.starter;
}

  private getDefaultPermissions(role: string): string[]
{
  const permissions: Record<string, string[]> = {
    owner: ['*'],
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_settings', 'manage_billing'],
    user: ['read', 'write', 'execute'],
    viewer: ['read'],
  };

  return permissions[role] || permissions.viewer;
}

private
getPerio;
dDate(date: Date, period: 'hourly' | 'daily')
: Date
{
  const periodDate = new Date(date);

  if (period === 'hourly') {
    periodDate.setMinutes(0, 0, 0);
  } else if (period === 'daily') {
    periodDate.setHours(0, 0, 0, 0);
  }

  return periodDate;
}

private
generateSecureToken();
: string
{
  return randomBytes(32).toString('hex');
}

private
generateId();
: string
{
  return `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

private
startPeriodicJobs();
: void
{
  // Schedule metrics collection every hour
  setInterval(
    () => {
      this.tenantQueue.add(
        'collect-metrics',
        {},
        {
          repeat: { every: 60 * 60 * 1000 }, // 1 hour
        }
      );
    },
    60 * 60 * 1000
  );

  // Schedule cleanup every day
  setInterval(
    () => {
      this.tenantQueue.add(
        'cleanup',
        {},
        {
          repeat: { every: 24 * 60 * 60 * 1000 }, // 24 hours
        }
      );
    },
    24 * 60 * 60 * 1000
  );
}

async;
shutdown();
: Promise<void>
{
  try {
    await this.worker.close();
    await this.metricsWorker.close();
    await this.cleanupWorker.close();
    await this.tenantQueue.close();

    logger.info('TenantService shutdown completed');
  } catch (error) {
    logger.error('Error during TenantService shutdown:', error);
    throw error;
  }
}
}

export * from './billing';
export * from './isolation';
