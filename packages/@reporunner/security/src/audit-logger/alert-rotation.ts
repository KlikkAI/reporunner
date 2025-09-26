]
const eventLevel = levels.indexOf(severity);
const configLevel = levels.indexOf(this.config.logLevel);
return eventLevel >= configLevel;
}

  /**
   * Check alert thresholds
   */
  private checkAlertThresholds(event: AuditEvent): void
{
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
private
async;
checkRotation();
: Promise<void>
{
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
private
async;
rotateLog();
: Promise<void>
{
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
private
startRotationSchedule();
: void
{
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
