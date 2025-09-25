}

  // Cleanup
  public stop(): void
{
  if (this.systemMetricsInterval) {
    clearInterval(this.systemMetricsInterval);
  }
  this.timers.clear();
  this.metrics = [];
}
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitorService();
export default performanceMonitor;
