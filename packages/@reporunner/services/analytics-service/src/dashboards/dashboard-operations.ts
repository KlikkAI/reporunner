}

  async updateWidget(
    dashboardId: string,
    widgetId: string,
    updates: Partial<Widget>
  ): Promise<boolean>
{
  const dashboard = this.dashboards.get(dashboardId);
  if (!dashboard) return false;

  const widgetIndex = dashboard.widgets.findIndex((w) => w.id === widgetId);
  if (widgetIndex === -1) return false;

  dashboard.widgets[widgetIndex] = {
    ...dashboard.widgets[widgetIndex],
    ...updates,
  };
  dashboard.updatedAt = new Date();

  return true;
}

async;
removeWidget(dashboardId: string, widgetId: string)
: Promise<boolean>
{
  const dashboard = this.dashboards.get(dashboardId);
  if (!dashboard) return false;

  const widgetIndex = dashboard.widgets.findIndex((w) => w.id === widgetId);
  if (widgetIndex === -1) return false;

  dashboard.widgets.splice(widgetIndex, 1);
  dashboard.updatedAt = new Date();

  return true;
}

async;
createFromTemplate(
    templateId: string,
    organizationId: string,
    ownerId: string,
    name?: string
  )
: Promise<string>
{
  const template = this.templates.get(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'> = {
    name: name || `${template.name} Dashboard`,
    description: template.description,
    organizationId,
    ownerId,
    widgets: template.widgets.map((widget) => ({
      ...widget,
      id: this.generateId(),
    })),
    layout: 'grid',
    shared: false,
  };

  return this.createDashboard(dashboard);
}

getTemplates();
: DashboardTemplate[]
{
  return Array.from(this.templates.values());
}

private
initializeTemplates();
: void
{
    // Executive Dashboard Template
    this.templates.set('executive', {
      id: 'executive',
      name: 'Executive Overview',
      description: 'High-level metrics for executives and stakeholders',
      category: 'executive',
      widgets: [
        {
          type: 'metric',
          title: 'Total Workflows',
          reportId: 'workflow-count',
          position: { x: 0, y: 0, width: 3, height: 2 },
          config: { format: 'number' },
        },
        {
          type: 'metric',
          title: 'Active Users',
          reportId: 'active-users',
          position: { x: 3, y: 0, width: 3, height: 2 },
          config: { format: 'number' },
        },
        {
          type: 'chart',
          title: 'Workflow Executions Over Time',
          reportId: 'executions-timeline',
          position: { x: 0, y: 2, width: 6, height: 4 },
          config: { chartType: 'line' },
        },
      ],
      reports: [],
    });

// Operational Dashboard Template
