/**
 * Enterprise Security API Routes
 * Provides secure access to enterprise security features
 */

import { Router, Request, Response } from 'express';
import { enterpriseSecurityService } from '../services/EnterpriseSecurityService';
import { z } from 'zod';

const router = Router();

// Security threat schemas
const CreateThreatSchema = z.object({
  type: z.enum(['brute_force', 'suspicious_activity', 'data_breach', 'privilege_escalation', 'malware', 'phishing']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  title: z.string(),
  description: z.string(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  sourceIp: z.string().optional(),
  userAgent: z.string().optional(),
  evidence: z.array(z.object({
    type: z.enum(['log_entry', 'network_traffic', 'file_access', 'api_call', 'user_behavior']),
    timestamp: z.string().datetime(),
    source: z.string(),
    data: z.record(z.any()),
    severity: z.enum(['info', 'warning', 'error', 'critical'])
  })),
  riskScore: z.number().min(0).max(100),
  affectedResources: z.array(z.string())
});

const VulnerabilityScanSchema = z.object({
  type: z.enum(['dependency', 'code', 'infrastructure', 'configuration']),
  metadata: z.record(z.any()).optional()
});

/**
 * GET /api/security/metrics
 * Get current security metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = enterpriseSecurityService.getSecurityMetrics();

    return res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get security metrics'
    });
  }
});

/**
 * GET /api/security/threats
 * Get security threats
 */
router.get('/threats', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      status: z.enum(['open', 'investigating', 'resolved', 'false_positive']).optional()
    });

    const { status } = schema.parse(req.query);
    const threats = enterpriseSecurityService.getSecurityThreats(status);

    return res.json({
      success: true,
      data: threats
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid query parameters'
    });
  }
});

/**
 * POST /api/security/threats
 * Create a new security threat
 */
router.post('/threats', async (req, res) => {
  try {
    const threatData = CreateThreatSchema.parse(req.body);

    // Convert timestamp strings to Date objects
    const processedThreatData = {
      ...threatData,
      evidence: threatData.evidence.map(e => ({
        ...e,
        timestamp: new Date(e.timestamp)
      }))
    };

    const threat = await enterpriseSecurityService.createThreat(processedThreatData);

    return res.status(201).json({
      success: true,
      data: threat
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create threat'
    });
  }
});

/**
 * PUT /api/security/threats/:id/status
 * Update threat status
 */
router.put('/threats/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      status: z.enum(['open', 'investigating', 'resolved', 'false_positive']),
      resolution: z.string().optional(),
      assignedTo: z.string().optional()
    });

    const { status, resolution, assignedTo } = schema.parse(req.body);

    const threat = await enterpriseSecurityService.updateThreatStatus(
      id,
      status,
      resolution,
      assignedTo
    );

    if (!threat) {
      return res.status(404).json({
        success: false,
        error: 'Threat not found'
      });
    }

    return res.json({
      success: true,
      data: threat
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update threat status'
    });
  }
});

/**
 * POST /api/security/scans
 * Start vulnerability scan
 */
router.post('/scans', async (req: Request, res: Response) => {
  try {
    const { type, metadata = {} } = VulnerabilityScanSchema.parse(req.body);

    const scan = await enterpriseSecurityService.startVulnerabilityScan(type, metadata);

    return res.status(201).json({
      success: true,
      data: scan
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to start vulnerability scan'
    });
  }
});

/**
 * GET /api/security/scans
 * Get vulnerability scans
 */
router.get('/scans', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      type: z.enum(['dependency', 'code', 'infrastructure', 'configuration']).optional()
    });

    const { type } = schema.parse(req.query);
    const scans = enterpriseSecurityService.getVulnerabilityScans(type);

    return res.json({
      success: true,
      data: scans
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid query parameters'
    });
  }
});

/**
 * GET /api/security/alerts
 * Get security alerts
 */
router.get('/alerts', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      acknowledged: z.boolean().optional()
    });

    const { acknowledged } = schema.parse(req.query);
    const alerts = enterpriseSecurityService.getSecurityAlerts(acknowledged);

    return res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Invalid query parameters'
    });
  }
});

/**
 * POST /api/security/alerts/:id/acknowledge
 * Acknowledge security alert
 */
router.post('/alerts/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const schema = z.object({
      acknowledgedBy: z.string()
    });

    const { acknowledgedBy } = schema.parse(req.body);

    const alert = await enterpriseSecurityService.acknowledgeAlert(id, acknowledgedBy);

    if (!alert) {
      return res.status(404).json({
        success: false,
        error: 'Alert not found'
      });
    }

    return res.json({
      success: true,
      data: alert
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acknowledge alert'
    });
  }
});

/**
 * GET /api/security/compliance
 * Get compliance frameworks
 */
router.get('/compliance', async (req: Request, res: Response) => {
  try {
    const frameworks = enterpriseSecurityService.getComplianceFrameworks();

    return res.json({
      success: true,
      data: frameworks
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get compliance frameworks'
    });
  }
});

/**
 * POST /api/security/compliance/:id/assess
 * Assess compliance for a framework
 */
router.post('/compliance/:id/assess', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const framework = await enterpriseSecurityService.assessCompliance(id);

    if (!framework) {
      return res.status(404).json({
        success: false,
        error: 'Compliance framework not found'
      });
    }

    return res.json({
      success: true,
      data: framework
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assess compliance'
    });
  }
});

export default router;
