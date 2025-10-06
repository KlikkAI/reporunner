/**
 * Backend API Routes Index
 * Centralized route configuration for all backend services
 */

import { Router } from 'express';
import auditRoutes from './audit';
import marketplaceRoutes from './marketplace';
import scheduleRoutes from './schedules';
import securityRoutes from './security';
import triggerRoutes from './triggers';

const router = Router();

// Mount route modules
router.use('/audit', auditRoutes);
router.use('/triggers', triggerRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/security', securityRoutes);
router.use('/marketplace', marketplaceRoutes);
router.use('/workflow-optimization', workflowOptimizationRoutes);

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'Backend API is healthy',
    timestamp: new Date().toISOString(),
    services: {
      audit: 'operational',
      triggers: 'operational',
      schedules: 'operational',
      marketplace: 'operational',
    },
  });
});

// API info endpoint
router.get('/info', (_req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Reporunner Backend API',
      version: '1.0.0',
      description: 'Backend services for workflow automation platform',
      endpoints: {
        audit: '/api/audit',
        triggers: '/api/triggers',
        schedules: '/api/schedules',
        marketplace: '/api/marketplace',
        workflowOptimization: '/api/workflow-optimization',
      },
    },
  });
});

export default router;
