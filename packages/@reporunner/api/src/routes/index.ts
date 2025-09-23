import type { Application } from 'express';
import { aiRoutes } from './ai';
import { analyticsRoutes } from './analytics';
import { authRoutes } from './auth';
import { credentialRoutes } from './credentials';
import { executionRoutes } from './executions';
import { nodeRoutes } from './nodes';
import { organizationRoutes } from './organizations';
import { userRoutes } from './users';
import { webhookRoutes } from './webhooks';
import { workflowRoutes } from './workflows';

export function setupRoutes(app: Application): void {
  // API version prefix
  const apiPrefix = '/api/v1';

  // Mount routes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/workflows`, workflowRoutes);
  app.use(`${apiPrefix}/executions`, executionRoutes);
  app.use(`${apiPrefix}/nodes`, nodeRoutes);
  app.use(`${apiPrefix}/credentials`, credentialRoutes);
  app.use(`${apiPrefix}/organizations`, organizationRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/ai`, aiRoutes);
  app.use(`${apiPrefix}/webhooks`, webhookRoutes);
  app.use(`${apiPrefix}/analytics`, analyticsRoutes);

  // API info endpoint
  app.get(`${apiPrefix}`, (_req, res) => {
    res.json({
      name: 'Reporunner API',
      version: '1.0.0',
      description: 'AI-powered workflow automation platform',
      documentation: '/docs',
      openapi: '/openapi.json',
      health: '/health',
      endpoints: {
        auth: `${apiPrefix}/auth`,
        workflows: `${apiPrefix}/workflows`,
        executions: `${apiPrefix}/executions`,
        nodes: `${apiPrefix}/nodes`,
        credentials: `${apiPrefix}/credentials`,
        organizations: `${apiPrefix}/organizations`,
        users: `${apiPrefix}/users`,
        ai: `${apiPrefix}/ai`,
        webhooks: `${apiPrefix}/webhooks`,
        analytics: `${apiPrefix}/analytics`,
      },
      timestamp: new Date().toISOString(),
    });
  });
}
