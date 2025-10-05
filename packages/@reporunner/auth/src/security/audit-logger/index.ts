// Simplified audit logger exports - remove references to non-existent modules
// TODO: Implement missing audit logger modules when needed

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  details?: Record<string, any>;
}

export interface AuditLogger {
  log(event: AuditEvent): Promise<void>;
  query(filters: Record<string, any>): Promise<AuditEvent[]>;
}

// Basic implementation placeholder
export class BasicAuditLogger implements AuditLogger {
  async log(_event: AuditEvent): Promise<void> {}

  async query(_filters: Record<string, any>): Promise<AuditEvent[]> {
    return [];
  }
}
