if (healths.length > 0) {
  summary.averageUptime = healths.reduce((sum, h) => sum + h.uptime, 0) / healths.length;
}

if (allMetrics.length > 0) {
  const totalRequests = allMetrics.reduce((sum, m) => sum + m.requestCount, 0);
  const totalErrors = allMetrics.reduce((sum, m) => sum + m.errorCount, 0);

  if (totalRequests > 0) {
    summary.overallSuccessRate = ((totalRequests - totalErrors) / totalRequests) * 100;
  }
}

return summary;
}

  /**
   * Export health report
   */
  exportReport():
{
  timestamp: Date;
  summary: ReturnType<typeof this.getSummary>;
  integrations: IntegrationHealth[];
}
{
  return {
      timestamp: new Date(),
      summary: this.getSummary(),
      integrations: Array.from(this.healthStatuses.values()),
    };
}

/**
 * Clear all
 */
clearAll();
: void
{
  // Clear all intervals
  for (const interval of this.checkIntervals.values()) {
    clearInterval(interval);
  }

  if (this.globalInterval) {
    clearInterval(this.globalInterval);
  }

  this.healthChecks.clear();
  this.healthStatuses.clear();
  this.checkIntervals.clear();
  this.metrics.clear();
  this.startTimes.clear();
  this.removeAllListeners();
}
}

// Singleton instance
export const healthMonitor = new IntegrationHealthMonitor();

export default IntegrationHealthMonitor;
