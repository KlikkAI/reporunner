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
}
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
