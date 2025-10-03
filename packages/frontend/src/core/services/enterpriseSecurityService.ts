/**
 * Enterprise Security Service - Stub
 * This service was removed during consolidation.
 * Minimal types provided for backward compatibility.
 */

export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AuditCategory = 'authentication' | 'authorization' | 'data-access' | 'configuration';

export interface AuditLog {
  id: string;
  timestamp: string;
  severity: AuditSeverity;
  category: AuditCategory;
  message: string;
  userId?: string;
  details?: Record<string, any>;
}

export interface ComplianceReport {
  id: string;
  framework: string;
  score: number;
  findings: any[];
}

export interface SecurityThreat {
  id: string;
  type: string;
  severity: AuditSeverity;
  description: string;
}

export interface SecurityMetrics {
  threatLevel: 'low' | 'medium' | 'high';
  activeThreats: number;
  resolvedThreats: number;
}

export interface VulnerabilityScan {
  id: string;
  timestamp: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  findings: any[];
  severity: AuditSeverity;
}

// Stub service class
class EnterpriseSecurityService {
  async getAuditLogs(): Promise<AuditLog[]> {
    return [];
  }

  async getComplianceReports(): Promise<ComplianceReport[]> {
    return [];
  }

  async getSecurityThreats(): Promise<SecurityThreat[]> {
    return [];
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    return {
      threatLevel: 'low',
      activeThreats: 0,
      resolvedThreats: 0,
    };
  }

  async getVulnerabilityScans(): Promise<VulnerabilityScan[]> {
    return [];
  }
}

export const enterpriseSecurityService = new EnterpriseSecurityService();
