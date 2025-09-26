/**
 * Log login attempt
 */
async;
logLogin(
    userId: string,
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  )
: Promise<void>
{
  await this.log({
    type: success ? AuditEventType.LOGIN_SUCCESS : AuditEventType.LOGIN_FAILED,
    severity: success ? AuditSeverity.LOW : AuditSeverity.MEDIUM,
    userId: success ? userId : undefined,
    userEmail: email,
    ipAddress,
    userAgent,
    action: `User ${email} attempted to login`,
    result: success ? 'SUCCESS' : 'FAILURE',
    details,
  });
}

/**
 * Log data access
 */
async;
logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    success: boolean,
    details?: any
  )
: Promise<void>
{
  const typeMap = {
    CREATE: AuditEventType.DATA_CREATE,
    READ: AuditEventType.DATA_READ,
    UPDATE: AuditEventType.DATA_UPDATE,
    DELETE: AuditEventType.DATA_DELETE,
  };

  await this.log({
    type: typeMap[action],
    severity: action === 'DELETE' ? AuditSeverity.HIGH : AuditSeverity.LOW,
    userId,
    resource,
    resourceId,
    action: `${action} ${resource}`,
    result: success ? 'SUCCESS' : 'FAILURE',
    details,
  });
}

/**
 * Log security event
 */
async;
logSecurityEvent(
    type: AuditEventType,
    severity: AuditSeverity,
    description: string,
    userId?: string,
    details?: any
  )
: Promise<void>
{
  await this.log({
    type,
    severity,
    userId,
    action: description,
    result: 'SUCCESS',
    details,
  });

  // Emit security alert for critical events
  if (severity === AuditSeverity.CRITICAL) {
    this.emit('security-alert', {
      type,
      severity,
      description,
      userId,
      details,
      timestamp: new Date(),
    });
  }
}

/**
 * Query audit logs
 */
async;
query(filters: {
    startDate?: Date;
endDate?: Date;
userId?: string;
type?: AuditEventType;
severity?: AuditSeverity;
resource?: string;
result?: 'SUCCESS' | 'FAILURE';
limit?: number;
}): Promise<AuditEvent[]>
{
// This would be implemented based on storage type
