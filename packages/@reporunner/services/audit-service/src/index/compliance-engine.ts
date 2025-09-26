}

  private initializeEventListeners(): void
{
  this.worker.on('completed', (job) => {
    logger.debug(`Audit job ${job.id} completed`);
  });

  this.worker.on('failed', (job, err) => {
    logger.error(`Audit job ${job?.id} failed:`, err);
  });

  this.eventBus.on('audit.event', (eventData) => {
    this.logEventAsync(eventData).catch((err) => {
      logger.error('Failed to log audit event:', err);
    });
  });

  this.eventBus.on('compliance.rule.violated', (data) => {
    this.handleComplianceViolation(data);
  });
}

async;
logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash'>)
: Promise<string>
{
  try {
    // Validate input
    const validatedEvent = AuditEventSchema.parse(event);

    const auditEvent: AuditEvent = {
      ...validatedEvent,
      id: this.generateId(),
      timestamp: new Date(),
      hash: this.calculateEventHash({
        ...validatedEvent,
        timestamp: new Date(),
      }),
    };

    // Add to processing queue for async handling
    await this.auditQueue.add('process-audit-event', auditEvent, {
      priority: this.getSeverityPriority(auditEvent.severity),
    });

    // Cache recent event for quick access
    await this.cacheRecentEvent(auditEvent);

    // Emit real-time event
    this.emit('audit.logged', auditEvent);
    this.eventBus.emit('audit.event.logged', auditEvent);

    return auditEvent.id;
  } catch (error) {
    logger.error('Failed to log audit event:', error);
    throw new Error(`Failed to log audit event: ${error.message}`);
  }
}

async;
logEventAsync(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash'>)
: Promise<void>
{
  try {
    await this.logEvent(event);
  } catch (error) {
    logger.error('Failed to log audit event async:', error);
  }
}

async;
logBulkEvents(events: Array<Omit<AuditEvent, 'id' | 'timestamp' | 'hash'>>)
: Promise<string[]>
{
  const eventIds: string[] = [];
  const batchSize = Math.min(this.BATCH_SIZE, events.length);

  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const batchPromises = batch.map((event) => this.logEvent(event));
    const batchIds = await Promise.all(batchPromises);
    eventIds.push(...batchIds);
  }

  return eventIds;
}

private
async;
processAuditJob(job: Job)
: Promise<void>
{
  const auditEvent: AuditEvent = job.data;

  try {
    // Store in database
    await this.database.create(this.AUDIT_COLLECTION, auditEvent);

    // Check compliance rules
    await this.checkComplianceRules(auditEvent);

    // Check alert rules
    await this.checkAlertRules(auditEvent);

    // Update metrics cache
    await this.updateMetricsCache(auditEvent);

    logger.debug(`Audit event ${auditEvent.id} processed successfully`);
  } catch (error) {
    logger.error(`Failed to process audit event ${auditEvent.id}:`, error);
    throw error;
  }
}
