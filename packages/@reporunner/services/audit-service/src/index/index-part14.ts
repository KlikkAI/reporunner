private
getSeverityPriority(severity: string)
: number
{
  const priorities = { critical: 1, high: 2, medium: 3, low: 4 };
  return priorities[severity] || 4;
}

private
hashFilter(filter: AuditFilter)
: string
{
  return createHash('md5').update(JSON.stringify(filter)).digest('hex');
}

private
generateId();
: string
{
  return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

private
handleComplianceViolation(data: any)
: void
{
  logger.warn('Compliance violation detected:', {
    event: data.event.id,
    violations: data.violations.map((v: ComplianceRule) => v.name),
  });

  // Emit high-priority alert for critical violations
  const criticalViolations = data.violations.filter(
    (v: ComplianceRule) => v.severity === 'critical'
  );
  if (criticalViolations.length > 0) {
    this.emit('critical.violation', {
      event: data.event,
      violations: criticalViolations,
    });
  }
}

async;
shutdown();
: Promise<void>
{
  try {
    await this.worker.close();
    await this.retentionWorker.close();
    await this.alertWorker.close();
    await this.auditQueue.close();

    logger.info('AuditService shutdown completed');
  } catch (error) {
    logger.error('Error during AuditService shutdown:', error);
    throw error;
  }
}
}

export * from './compliance';
export * from './retention';
