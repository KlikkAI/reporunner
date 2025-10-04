/**
 * Backend API Routes Index
 * Centralized route configuration for all backend services
 */

import { Router } from 'express';
import auditRoutes from './audit';
import triggerRoutes from './triggers';
import scheduleRoutes from './schedules';
import securityRoutes from './security';

const router = Router();

// Mount route modules
router.use('/audit', auditRoutes);
router.use('/triggers', triggerRoutes);
router.use('/schedules', scheduleRoutes);
router.use('/security', securityRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend API is healthy',
    timestamp: new Date().toISOString(),
    services: {
      audit: 'operational',
      triggers: 'operational',
      schedules: 'operational'
    }
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Reporunner Backend API',
      version: '1.0.0',
      description: 'Backend services for workflow automation platform',
      endpoints: {
        audit: '/api/audit',
        triggers: '/api/triggers',
        schedules: '/api/schedules'
      }
    }
  });
});

export default router;
