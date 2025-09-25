event.data.organizationId || 'system';
)

if (event.data.duration) {
  await this.recordMetric(
    'workflow_execution_duration',
    event.data.duration,
    {
      workflow_id: event.data.workflowId,
      status: event.data.status,
    },
    event.data.organizationId || 'system'
  );
}
}
    } catch (error)
{
  logger.error('Failed to handle execution event', error);
}
}

  private async handleUserEvent(event: any): Promise<void>
{
  try {
    await this.trackEvent({
      type: `user.${event.type}`,
      organizationId: event.data.organizationId || 'system',
      userId: event.data.userId,
      source: 'auth_service',
      data: event.data,
      correlationId: event.correlationId,
    });

    // Track user metrics
    if (event.type === 'login') {
      await this.incrementCounter(
        'user_logins_total',
        { method: event.data.method || 'password' },
        event.data.organizationId || 'system'
      );
    }
  } catch (error) {
    logger.error('Failed to handle user event', error);
  }
}

private
async;
handleSystemEvent(event: any)
: Promise<void>
{
  try {
    await this.trackEvent({
      type: `system.${event.type}`,
      organizationId: 'system',
      source: 'system',
      data: event.data,
      correlationId: event.correlationId,
    });
  } catch (error) {
    logger.error('Failed to handle system event', error);
  }
}

async;
healthCheck();
: Promise<
{
  status: 'healthy' | 'unhealthy';
  metrics: {
    eventsProcessed24h: number;
    metricsRecorded24h: number;
    activeSessions: number;
  }
}
>
{
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [eventsProcessed, metricsRecorded, activeSessions] = await Promise.all([
      this.events.countDocuments({ timestamp: { $gte: last24h } }),
      this.metrics.countDocuments({ timestamp: { $gte: last24h } }),
      this.userSessions.countDocuments({
        $or: [{ endedAt: { $exists: false } }, { endedAt: { $gte: last24h } }],
      }),
    ]);

    return {
        status: 'healthy',
        metrics: {
          eventsProcessed24h: eventsProcessed,
          metricsRecorded24h: metricsRecorded,
          activeSessions
        }
      };
  } catch (error) {
    return {
        status: 'unhealthy',
        metrics: {
          eventsProcessed24h: 0,
          metricsRecorded24h: 0,
          activeSessions: 0
        }
      };
  }
}
