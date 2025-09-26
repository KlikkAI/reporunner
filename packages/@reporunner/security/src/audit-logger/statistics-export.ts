}

const userCounts = new Map<string, number>();

for (const log of logs) {
  // Count by type
  stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;

  // Count by severity
  stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;

  // Count by result
  stats.byResult[log.result]++;

  // Count by user
  if (log.userId) {
    userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
  }
}

// Calculate failure rate
if (stats.totalEvents > 0) {
  stats.failureRate = (stats.byResult.FAILURE / stats.totalEvents) * 100;
}

// Get top users
stats.topUsers = Array.from(userCounts.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([userId, count]) => ({ userId, count }));

return stats;
}

  /**
   * Export audit logs
   */
  async
export
(format: 'json' | 'csv', filters?: any): Promise<string> {
    const logs = await this.query(filters || {});

    // Log the export action
    await this.log({
      type: AuditEventType.DATA_EXPORT,
      severity: AuditSeverity.MEDIUM,
      action: 'Audit logs exported',
      result: 'SUCCESS',
      details: { format, recordCount: logs.length, filters },
    });

    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    } else {
      // Convert to CSV
      const headers = [
        'ID',
        'Timestamp',
        'Type',
        'Severity',
        'User ID',
        'Email',
        'IP Address',
        'Resource',
        'Action',
        'Result',
      ];

      const rows = logs.map((log) => [
        log.id,
        log.timestamp.toISOString(),
        log.type,
        log.severity,
        log.userId || '',
        log.userEmail || '',
        log.ipAddress || '',
        log.resource || '',
        log.action,
        log.result,
      ]);

      return [headers, ...rows].map((row) => row.join(',')).join('\n');
    }
  }

/**
 * Process event queue
 */
private
async;
processQueue();
: Promise<void>
{
    if (this.isProcessing || this.eventQueue.length === 0) return;

    this.isProcessing = true;
    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      for (const event of events) {
        await this.persistEvent(event);
      }
    } catch (_error) {
      // Re-add failed events to queue
      this.eventQueue.unshift(...events);
