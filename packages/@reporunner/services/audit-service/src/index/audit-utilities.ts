for (const rule of rules) {
  violations += events.filter((event) => this.checkRuleViolation(rule, event)).length;
}

const score = Math.max(
  0,
  Math.min(100, ((events.length - violations) / Math.max(1, events.length)) * 100)
);
scores[standard] = Math.round(score);
}

return scores;
}

  private async countAnomalies(events: AuditEvent[]): Promise<number>
{
  // Simple anomaly detection based on unusual patterns
  let anomalies = 0;

  // Check for unusual high-risk events
  anomalies += events.filter((e) => e.risk_score && e.risk_score > 90).length;

  // Check for unusual failure rates
  const failures = events.filter((e) => e.outcome === 'failure').length;
  const failureRate = failures / events.length;
  if (failureRate > 0.1) anomalies += Math.floor(failures * 0.5); // 50% of failures considered anomalies

  // Check for unusual activity patterns (high frequency from single user)
  const userCounts = this.groupBy(events, 'userId');
  const avgEventsPerUser = events.length / Object.keys(userCounts).length;

  Object.values(userCounts).forEach((count) => {
    if (count > avgEventsPerUser * 5) {
      // 5x above average
      anomalies += Math.floor(count * 0.2); // 20% considered anomalies
    }
  });

  return anomalies;
}

private
convertToCSV(events: AuditEvent[])
: string
{
  if (events.length === 0) return '';

  const headers = [
    'id',
    'timestamp',
    'userId',
    'organizationId',
    'action',
    'resource',
    'resourceId',
    'outcome',
    'severity',
    'risk_score',
    'ip',
    'userAgent',
    'sessionId',
    'details',
  ];

  const rows = events.map((event) =>
    headers
      .map((header) => {
        const value = event[header as keyof AuditEvent];
        if (typeof value === 'object' && value !== null) {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value || '').replace(/"/g, '""')}"`;
      })
      .join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

private
convertToXML(events: AuditEvent[])
: string
{
  const xmlEvents = events
    .map((event) => {
      const fields = Object.entries(event)
        .map(([key, value]) => {
          const xmlValue =
            typeof value === 'object' && value !== null
              ? `<![CDATA[${JSON.stringify(value)}]]>`
              : String(value || '');
          return `<${key}>${xmlValue}</${key}>`;
        })
        .join('');
      return `<event>${fields}</event>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><audit_events>${xmlEvents}</audit_events>`;
}

private
async;
convertToXLSX(events: AuditEvent[])
: Promise<Buffer>
{
  // Implementation would require xlsx library
  // For now, return CSV as bytes
  const csv = this.convertToCSV(events);
  return Buffer.from(csv, 'utf8');
}

private
calculateEventHash(event: Partial<AuditEvent>)
: string
{
  const hashableFields = {
    userId: event.userId,
    organizationId: event.organizationId,
    action: event.action,
    resource: event.resource,
    resourceId: event.resourceId,
    outcome: event.outcome,
    timestamp: event.timestamp?.toISOString(),
  };

  const hashString = JSON.stringify(hashableFields);
  return createHash('sha256').update(hashString).digest('hex');
}
