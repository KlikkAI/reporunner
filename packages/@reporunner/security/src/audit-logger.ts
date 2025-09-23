import { randomBytes } from 'node:crypto';
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

// const writeFile = promisify(fs.writeFile); // Removed unused function
const appendFile = promisify(fs.appendFile);
const mkdir = promisify(fs.mkdir);

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  TOKEN_REFRESH = 'TOKEN_REFRESH',
  TOKEN_REVOKED = 'TOKEN_REVOKED',
  PASSWORD_RESET = 'PASSWORD_RESET',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  MFA_ENABLED = 'MFA_ENABLED',
  MFA_DISABLED = 'MFA_DISABLED',

  // Authorization events
  ACCESS_GRANTED = 'ACCESS_GRANTED',
  ACCESS_DENIED = 'ACCESS_DENIED',
  PERMISSION_CHANGED = 'PERMISSION_CHANGED',
  ROLE_CHANGED = 'ROLE_CHANGED',

  // Data events
  DATA_CREATE = 'DATA_CREATE',
  DATA_READ = 'DATA_READ',
  DATA_UPDATE = 'DATA_UPDATE',
  DATA_DELETE = 'DATA_DELETE',
  DATA_EXPORT = 'DATA_EXPORT',
  DATA_IMPORT = 'DATA_IMPORT',

  // System events
  CONFIG_CHANGED = 'CONFIG_CHANGED',
  SERVICE_START = 'SERVICE_START',
  SERVICE_STOP = 'SERVICE_STOP',
  ERROR_OCCURRED = 'ERROR_OCCURRED',
  SECURITY_ALERT = 'SECURITY_ALERT',

  // Workflow events
  WORKFLOW_CREATED = 'WORKFLOW_CREATED',
  WORKFLOW_UPDATED = 'WORKFLOW_UPDATED',
  WORKFLOW_DELETED = 'WORKFLOW_DELETED',
  WORKFLOW_EXECUTED = 'WORKFLOW_EXECUTED',
  WORKFLOW_FAILED = 'WORKFLOW_FAILED',

  // API events
  API_KEY_CREATED = 'API_KEY_CREATED',
  API_KEY_REVOKED = 'API_KEY_REVOKED',
  API_RATE_LIMIT = 'API_RATE_LIMIT',

  // File events
  FILE_UPLOADED = 'FILE_UPLOADED',
  FILE_DOWNLOADED = 'FILE_DOWNLOADED',
  FILE_DELETED = 'FILE_DELETED',
  FILE_SHARED = 'FILE_SHARED',

  // User management
  USER_CREATED = 'USER_CREATED',
  USER_UPDATED = 'USER_UPDATED',
  USER_DELETED = 'USER_DELETED',
  USER_SUSPENDED = 'USER_SUSPENDED',
  USER_ACTIVATED = 'USER_ACTIVATED',
}

export enum AuditSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  severity: AuditSeverity;
  userId?: string;
  userEmail?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  resourceId?: string;
  action: string;
  result: 'SUCCESS' | 'FAILURE';
  details?: any;
  metadata?: Record<string, any>;
  hash?: string;
  previousHash?: string;
}

export interface AuditLoggerConfig {
  enabled?: boolean;
  logLevel?: AuditSeverity;
  storageType?: 'file' | 'database' | 'both';
  filePath?: string;
  rotationEnabled?: boolean;
  rotationSize?: number; // Size in MB
  rotationInterval?: number; // Interval in days
  enableHashing?: boolean; // For tamper detection
  enableEncryption?: boolean;
  encryptionKey?: string;
  retentionDays?: number;
  realTimeAlerts?: boolean;
  alertThresholds?: {
    failedLogins?: number;
    accessDenied?: number;
    dataExports?: number;
  };
}

export class AuditLogger extends EventEmitter {
  private config: Required<AuditLoggerConfig>;
  private currentLogFile: string;
  private lastHash: string = '';
  private eventQueue: AuditEvent[] = [];
  private isProcessing: boolean = false;
  private alertCounters: Map<string, number> = new Map();

  constructor(config: AuditLoggerConfig = {}) {
    super();

    this.config = {
      enabled: true,
      logLevel: AuditSeverity.LOW,
      storageType: 'file',
      filePath: path.join(process.cwd(), 'audit-logs'),
      rotationEnabled: true,
      rotationSize: 100, // 100 MB
      rotationInterval: 30, // 30 days
      enableHashing: true,
      enableEncryption: false,
      encryptionKey: '',
      retentionDays: 90,
      realTimeAlerts: true,
      alertThresholds: {
        failedLogins: 5,
        accessDenied: 10,
        dataExports: 20,
      },
      ...config,
    };

    this.currentLogFile = this.getLogFileName();
    this.initializeStorage();
    this.startProcessor();

    if (this.config.rotationEnabled) {
      this.startRotationSchedule();
    }

    if (this.config.retentionDays > 0) {
      this.startRetentionSchedule();
    }
  }

  /**
   * Log an audit event
   */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'hash' | 'previousHash'>): Promise<void> {
    if (!this.config.enabled) return;

    // Check if event meets log level requirement
    if (!this.shouldLog(event.severity)) return;

    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
    };

    // Add hash for tamper detection
    if (this.config.enableHashing) {
      auditEvent.previousHash = this.lastHash;
      auditEvent.hash = this.generateHash(auditEvent);
      this.lastHash = auditEvent.hash;
    }

    // Add to queue for processing
    this.eventQueue.push(auditEvent);

    // Check for security alerts
    if (this.config.realTimeAlerts) {
      this.checkAlertThresholds(auditEvent);
    }

    // Emit event for real-time monitoring
    this.emit('audit', auditEvent);

    // Process queue if not already processing
    if (!this.isProcessing) {
      await this.processQueue();
    }
  }

  /**
   * Log login attempt
   */
  async logLogin(
    userId: string,
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: any
  ): Promise<void> {
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
  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
    success: boolean,
    details?: any
  ): Promise<void> {
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
  async logSecurityEvent(
    type: AuditEventType,
    severity: AuditSeverity,
    description: string,
    userId?: string,
    details?: any
  ): Promise<void> {
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
  async query(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    type?: AuditEventType;
    severity?: AuditSeverity;
    resource?: string;
    result?: 'SUCCESS' | 'FAILURE';
    limit?: number;
  }): Promise<AuditEvent[]> {
    // This would be implemented based on storage type
    // For file storage, read and filter logs
    // For database, run query
    const logs = await this.readLogs();

    return logs
      .filter((log) => {
        if (filters.startDate && log.timestamp < filters.startDate) return false;
        if (filters.endDate && log.timestamp > filters.endDate) return false;
        if (filters.userId && log.userId !== filters.userId) return false;
        if (filters.type && log.type !== filters.type) return false;
        if (filters.severity && log.severity !== filters.severity) return false;
        if (filters.resource && log.resource !== filters.resource) return false;
        if (filters.result && log.result !== filters.result) return false;
        return true;
      })
      .slice(0, filters.limit || 1000);
  }

  /**
   * Verify log integrity
   */
  async verifyIntegrity(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    valid: boolean;
    errors: string[];
    totalEvents: number;
    validEvents: number;
  }> {
    if (!this.config.enableHashing) {
      return {
        valid: false,
        errors: ['Hashing is not enabled'],
        totalEvents: 0,
        validEvents: 0,
      };
    }

    const logs = await this.query({ startDate, endDate });
    const errors: string[] = [];
    let validEvents = 0;
    let previousHash = '';

    for (const log of logs) {
      if (!log.hash) {
        errors.push(`Event ${log.id} missing hash`);
        continue;
      }

      if (log.previousHash !== previousHash) {
        errors.push(`Event ${log.id} has invalid previous hash`);
        continue;
      }

      const expectedHash = this.generateHash({
        ...log,
        // hash: undefined, // Removed as not part of base event
      });

      if (log.hash !== expectedHash) {
        errors.push(`Event ${log.id} has been tampered with`);
        continue;
      }

      validEvents++;
      previousHash = log.hash;
    }

    return {
      valid: errors.length === 0,
      errors,
      totalEvents: logs.length,
      validEvents,
    };
  }

  /**
   * Get audit statistics
   */
  async getStatistics(
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEvents: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byResult: Record<string, number>;
    topUsers: Array<{ userId: string; count: number }>;
    failureRate: number;
  }> {
    const logs = await this.query({ startDate, endDate });

    const stats = {
      totalEvents: logs.length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      byResult: { SUCCESS: 0, FAILURE: 0 },
      topUsers: [] as Array<{ userId: string; count: number }>,
      failureRate: 0,
    };

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
  async export(format: 'json' | 'csv', filters?: any): Promise<string> {
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
  private async processQueue(): Promise<void> {
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
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Persist event to storage
   */
  private async persistEvent(event: AuditEvent): Promise<void> {
    if (this.config.storageType === 'file' || this.config.storageType === 'both') {
      await this.writeToFile(event);
    }

    if (this.config.storageType === 'database' || this.config.storageType === 'both') {
      // Database implementation would go here
      // await this.writeToDatabase(event);
    }
  }

  /**
   * Write event to file
   */
  private async writeToFile(event: AuditEvent): Promise<void> {
    const logLine = `${JSON.stringify(event)}\n`;
    const logPath = path.join(this.config.filePath, this.currentLogFile);

    await appendFile(logPath, logLine);

    // Check for rotation
    if (this.config.rotationEnabled) {
      await this.checkRotation();
    }
  }

  /**
   * Read logs from file
   */
  private async readLogs(): Promise<AuditEvent[]> {
    const logPath = path.join(this.config.filePath, this.currentLogFile);

    if (!fs.existsSync(logPath)) {
      return [];
    }

    const content = fs.readFileSync(logPath, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    return lines.map((line) => {
      const event = JSON.parse(line);
      event.timestamp = new Date(event.timestamp);
      return event;
    });
  }

  /**
   * Initialize storage
   */
  private async initializeStorage(): Promise<void> {
    if (this.config.storageType === 'file' || this.config.storageType === 'both') {
      if (!fs.existsSync(this.config.filePath)) {
        await mkdir(this.config.filePath, { recursive: true });
      }
    }
  }

  /**
   * Generate event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${randomBytes(8).toString('hex')}`;
  }

  /**
   * Generate hash for event
   */
  private generateHash(event: Omit<AuditEvent, 'hash'>): string {
    const data = JSON.stringify({
      ...event,
      // hash property already omitted from type
    });
    return require('node:crypto').createHash('sha256').update(data).digest('hex');
  }

  /**
   * Get log file name
   */
  private getLogFileName(): string {
    const date = new Date();
    return `audit-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}.log`;
  }

  /**
   * Check if event should be logged based on severity
   */
  private shouldLog(severity: AuditSeverity): boolean {
    const levels = [
      AuditSeverity.LOW,
      AuditSeverity.MEDIUM,
      AuditSeverity.HIGH,
      AuditSeverity.CRITICAL,
    ];
    const eventLevel = levels.indexOf(severity);
    const configLevel = levels.indexOf(this.config.logLevel);
    return eventLevel >= configLevel;
  }

  /**
   * Check alert thresholds
   */
  private checkAlertThresholds(event: AuditEvent): void {
    const thresholds = this.config.alertThresholds;

    if (!thresholds) return;

    // Track failed logins
    if (event.type === AuditEventType.LOGIN_FAILED && thresholds.failedLogins) {
      const key = `login_failed:${event.userEmail || event.ipAddress}`;
      const count = (this.alertCounters.get(key) || 0) + 1;
      this.alertCounters.set(key, count);

      if (count >= thresholds.failedLogins) {
        this.emit('threshold-exceeded', {
          type: 'FAILED_LOGINS',
          threshold: thresholds.failedLogins,
          count,
          identifier: event.userEmail || event.ipAddress,
        });
        this.alertCounters.delete(key);
      }
    }

    // Track access denied
    if (event.type === AuditEventType.ACCESS_DENIED && thresholds.accessDenied) {
      const key = `access_denied:${event.userId || event.ipAddress}`;
      const count = (this.alertCounters.get(key) || 0) + 1;
      this.alertCounters.set(key, count);

      if (count >= thresholds.accessDenied) {
        this.emit('threshold-exceeded', {
          type: 'ACCESS_DENIED',
          threshold: thresholds.accessDenied,
          count,
          identifier: event.userId || event.ipAddress,
        });
        this.alertCounters.delete(key);
      }
    }

    // Reset counters periodically
    setTimeout(() => {
      this.alertCounters.clear();
    }, 3600000); // 1 hour
  }

  /**
   * Check if log rotation is needed
   */
  private async checkRotation(): Promise<void> {
    const logPath = path.join(this.config.filePath, this.currentLogFile);

    if (!fs.existsSync(logPath)) return;

    const stats = fs.statSync(logPath);
    const sizeInMB = stats.size / (1024 * 1024);

    if (sizeInMB >= this.config.rotationSize) {
      await this.rotateLog();
    }
  }

  /**
   * Rotate log file
   */
  private async rotateLog(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const oldPath = path.join(this.config.filePath, this.currentLogFile);
    const newPath = path.join(this.config.filePath, `${this.currentLogFile}.${timestamp}`);

    fs.renameSync(oldPath, newPath);
    this.currentLogFile = this.getLogFileName();

    this.emit('log-rotated', { oldFile: oldPath, newFile: newPath });
  }

  /**
   * Start rotation schedule
   */
  private startRotationSchedule(): void {
    setInterval(
      async () => {
        const newFileName = this.getLogFileName();
        if (newFileName !== this.currentLogFile) {
          this.currentLogFile = newFileName;
        }
      },
      24 * 60 * 60 * 1000
    ); // Check daily
  }

  /**
   * Start retention schedule
   */
  private startRetentionSchedule(): void {
    setInterval(
      async () => {
        await this.cleanOldLogs();
      },
      24 * 60 * 60 * 1000
    ); // Run daily
  }

  /**
   * Clean old logs based on retention policy
   */
  private async cleanOldLogs(): Promise<void> {
    const files = fs.readdirSync(this.config.filePath);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    for (const file of files) {
      const filePath = path.join(this.config.filePath, file);
      const stats = fs.statSync(filePath);

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath);
        this.emit('log-deleted', { file: filePath, age: stats.mtime });
      }
    }
  }

  /**
   * Start background processor
   */
  private startProcessor(): void {
    setInterval(async () => {
      await this.processQueue();
    }, 5000); // Process every 5 seconds
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger({
  enabled: process.env.AUDIT_ENABLED !== 'false',
  logLevel: (process.env.AUDIT_LOG_LEVEL as AuditSeverity) || AuditSeverity.LOW,
  storageType: (process.env.AUDIT_STORAGE as any) || 'file',
  filePath: process.env.AUDIT_LOG_PATH || path.join(process.cwd(), 'audit-logs'),
  enableHashing: process.env.AUDIT_ENABLE_HASHING !== 'false',
  retentionDays: parseInt(process.env.AUDIT_RETENTION_DAYS || '90', 10),
});

export default AuditLogger;
