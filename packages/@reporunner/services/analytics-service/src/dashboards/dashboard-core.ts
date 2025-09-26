import type { ReportDefinition } from './reports';

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

  async createDashboard(
    dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
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

    return dashboards.filter((dashboard) => {
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
