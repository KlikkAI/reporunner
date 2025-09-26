} finally
{
  this.isProcessing = false;
}
}

  /**
   * Persist event to storage
   */
  private async persistEvent(event: AuditEvent): Promise<void>
{
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
private
async;
writeToFile(event: AuditEvent)
: Promise<void>
{
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
private
async;
readLogs();
: Promise<AuditEvent[]>
{
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
private
async;
initializeStorage();
: Promise<void>
{
  if (this.config.storageType === 'file' || this.config.storageType === 'both') {
    if (!fs.existsSync(this.config.filePath)) {
      await mkdir(this.config.filePath, { recursive: true });
    }
  }
}

/**
 * Generate event ID
 */
private
generateEventId();
: string
{
  return `${Date.now()}-${randomBytes(8).toString('hex')}`;
}

/**
 * Generate hash for event
 */
private
generateHash(event: Omit<AuditEvent, 'hash'>)
: string
{
  const data = JSON.stringify({
    ...event,
    // hash property already omitted from type
  });
  return require('node:crypto').createHash('sha256').update(data).digest('hex');
}

/**
 * Get log file name
 */
private
getLogFileName();
: string
{
  const date = new Date();
  return `audit-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}.log`;
}

/**
 * Check if event should be logged based on severity
 */
private
shouldLog(severity: AuditSeverity)
: boolean
{
    const levels = [
      AuditSeverity.LOW,
      AuditSeverity.MEDIUM,
      AuditSeverity.HIGH,
      AuditSeverity.CRITICAL,
