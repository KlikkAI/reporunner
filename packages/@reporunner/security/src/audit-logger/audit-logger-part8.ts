* Start retention schedule
   */
  private startRetentionSchedule(): void
{
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
private
async;
cleanOldLogs();
: Promise<void>
{
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
private
startProcessor();
: void
{
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
