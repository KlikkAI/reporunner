/**
 * Frontend Security Hooks
 * React hooks for enterprise security features (calls backend API)
 */

import type {
  ComplianceRequirementDTO,
  ScanType,
  SecurityAlertDTO,
  SecurityComplianceFrameworkDTO,
  SecurityEvidenceDTO,
  SecurityMetricsDTO,
  SecurityThreatDTO,
  SeverityLevel,
  ThreatStatus,
  VulnerabilityFinding,
  VulnerabilityScanDTO,
} from '@klikkflow/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Re-export types for convenience
export type {
  ComplianceRequirementDTO as ComplianceRequirement,
  ScanType,
  SecurityAlertDTO as SecurityAlert,
  SecurityComplianceFrameworkDTO as ComplianceFramework,
  SecurityEvidenceDTO as SecurityEvidence,
  SecurityMetricsDTO as SecurityMetrics,
  SecurityThreatDTO as SecurityThreat,
  SeverityLevel,
  ThreatStatus,
  VulnerabilityFinding,
  VulnerabilityScanDTO as VulnerabilityScan,
};

/**
 * Hook to get security metrics
 */
export const useSecurityMetrics = () => {
  return useQuery({
    queryKey: ['security', 'metrics'],
    queryFn: async () => {
      const response = await fetch('/api/security/metrics');

      if (!response.ok) {
        throw new Error('Failed to fetch security metrics');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

/**
 * Hook to get security threats
 */
export const useSecurityThreats = (status?: ThreatStatus) => {
  return useQuery({
    queryKey: ['security', 'threats', { status }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`/api/security/threats?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch security threats');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to create a security threat
 */
export const useCreateThreat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (threat: Omit<SecurityThreatDTO, 'id' | 'detectedAt' | 'status'>) => {
      const response = await fetch('/api/security/threats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(threat),
      });

      if (!response.ok) {
        throw new Error('Failed to create security threat');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch threats
      queryClient.invalidateQueries({ queryKey: ['security', 'threats'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'metrics'] });
    },
  });
};

/**
 * Hook to update threat status
 */
export const useUpdateThreatStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      threatId,
      status,
      resolution,
      assignedTo,
    }: {
      threatId: string;
      status: ThreatStatus;
      resolution?: string;
      assignedTo?: string;
    }) => {
      const response = await fetch(`/api/security/threats/${threatId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, resolution, assignedTo }),
      });

      if (!response.ok) {
        throw new Error('Failed to update threat status');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate threats and metrics
      queryClient.invalidateQueries({ queryKey: ['security', 'threats'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'metrics'] });
    },
  });
};

/**
 * Hook to start vulnerability scan
 */
export const useStartVulnerabilityScan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      metadata = {},
    }: {
      type: ScanType;
      metadata?: Record<string, unknown>;
    }) => {
      const response = await fetch('/api/security/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, metadata }),
      });

      if (!response.ok) {
        throw new Error('Failed to start vulnerability scan');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate scans
      queryClient.invalidateQueries({ queryKey: ['security', 'scans'] });
    },
  });
};

/**
 * Hook to get vulnerability scans
 */
export const useVulnerabilityScans = (type?: ScanType) => {
  return useQuery({
    queryKey: ['security', 'scans', { type }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (type) {
        params.append('type', type);
      }

      const response = await fetch(`/api/security/scans?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch vulnerability scans');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 10000, // Refetch every 10 seconds for running scans
  });
};

/**
 * Hook to get security alerts
 */
export const useSecurityAlerts = (acknowledged?: boolean) => {
  return useQuery({
    queryKey: ['security', 'alerts', { acknowledged }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (acknowledged !== undefined) {
        params.append('acknowledged', acknowledged.toString());
      }

      const response = await fetch(`/api/security/alerts?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch security alerts');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

/**
 * Hook to acknowledge security alert
 */
export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      alertId,
      acknowledgedBy,
    }: {
      alertId: string;
      acknowledgedBy: string;
    }) => {
      const response = await fetch(`/api/security/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ acknowledgedBy }),
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate alerts
      queryClient.invalidateQueries({ queryKey: ['security', 'alerts'] });
    },
  });
};

/**
 * Hook to get compliance frameworks
 */
export const useComplianceFrameworks = () => {
  return useQuery({
    queryKey: ['security', 'compliance'],
    queryFn: async () => {
      const response = await fetch('/api/security/compliance');

      if (!response.ok) {
        throw new Error('Failed to fetch compliance frameworks');
      }

      return response.json();
    },
    staleTime: 300000, // 5 minutes
  });
};

/**
 * Hook to assess compliance
 */
export const useAssessCompliance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frameworkId: string) => {
      const response = await fetch(`/api/security/compliance/${frameworkId}/assess`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to assess compliance');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate compliance data
      queryClient.invalidateQueries({ queryKey: ['security', 'compliance'] });
      queryClient.invalidateQueries({ queryKey: ['security', 'metrics'] });
    },
  });
};
