this.templates.set('operational', {
  id: 'operational',
  name: 'Operational Metrics',
  description: 'Day-to-day operational insights and performance metrics',
  category: 'operational',
  widgets: [
    {
      type: 'metric',
      title: 'Success Rate',
      reportId: 'success-rate',
      position: { x: 0, y: 0, width: 2, height: 2 },
      config: { format: 'percentage' },
    },
    {
      type: 'metric',
      title: 'Avg Execution Time',
      reportId: 'avg-execution-time',
      position: { x: 2, y: 0, width: 2, height: 2 },
      config: { format: 'duration' },
    },
    {
      type: 'table',
      title: 'Recent Failures',
      reportId: 'recent-failures',
      position: { x: 0, y: 2, width: 4, height: 4 },
      config: { maxRows: 10 },
    },
  ],
  reports: [],
});
}

  private generateId(): string
{
  return Math.random().toString(36).substr(2, 9);
}
}
