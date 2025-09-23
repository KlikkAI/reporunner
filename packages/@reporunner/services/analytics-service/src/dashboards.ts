import { ReportDefinition } from './reports';

export interface Widget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'text';
  title: string;
  reportId: string;
  position: { x: number; y: number; width: number; height: number };
  config: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  organizationId: string;
  ownerId: string;
  widgets: Widget[];
  layout: 'grid' | 'freeform';
  shared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: 'executive' | 'operational' | 'technical' | 'custom';
  widgets: Omit<Widget, 'id'>[];
  reports: ReportDefinition[];
}

export class DashboardManager {
  private dashboards = new Map<string, Dashboard>();
  private templates = new Map<string, DashboardTemplate>();

  constructor() {
    this.initializeTemplates();
  }

  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const newDashboard: Dashboard = {
      ...dashboard,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.dashboards.set(newDashboard.id, newDashboard);
    return newDashboard.id;
  }

  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<boolean> {
    const existing = this.dashboards.get(id);
    if (!existing) return false;

    this.dashboards.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    });
    return true;
  }

  async deleteDashboard(id: string): Promise<boolean> {
    return this.dashboards.delete(id);
  }

  async getDashboard(id: string): Promise<Dashboard | undefined> {
    return this.dashboards.get(id);
  }

  async getDashboards(organizationId?: string, userId?: string): Promise<Dashboard[]> {
    const dashboards = Array.from(this.dashboards.values());

    return dashboards.filter(dashboard => {
      const matchesOrg = !organizationId || dashboard.organizationId === organizationId;
      const matchesUser = !userId || dashboard.ownerId === userId || dashboard.shared;
      return matchesOrg && matchesUser;
    });
  }

  async addWidget(dashboardId: string, widget: Omit<Widget, 'id'>): Promise<string> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    const newWidget: Widget = {
      ...widget,
      id: this.generateId(),
    };

    dashboard.widgets.push(newWidget);
    dashboard.updatedAt = new Date();

    return newWidget.id;
  }

  async updateWidget(dashboardId: string, widgetId: string, updates: Partial<Widget>): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return false;

    dashboard.widgets[widgetIndex] = {
      ...dashboard.widgets[widgetIndex],
      ...updates,
    };
    dashboard.updatedAt = new Date();

    return true;
  }

  async removeWidget(dashboardId: string, widgetId: string): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return false;

    dashboard.widgets.splice(widgetIndex, 1);
    dashboard.updatedAt = new Date();

    return true;
  }

  async createFromTemplate(templateId: string, organizationId: string, ownerId: string, name?: string): Promise<string> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'> = {
      name: name || `${template.name} Dashboard`,
      description: template.description,
      organizationId,
      ownerId,
      widgets: template.widgets.map(widget => ({
        ...widget,
        id: this.generateId(),
      })),
      layout: 'grid',
      shared: false,
    };

    return this.createDashboard(dashboard);
  }

  getTemplates(): DashboardTemplate[] {
    return Array.from(this.templates.values());
  }

  private initializeTemplates(): void {
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

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}