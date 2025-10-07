/**
 * Frontend Audit Hooks
 * React hooks for audit functionality (calls backend API)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface AuditQuery {
  userId?: string;
  organizationId?: string;
  category?: 'authentication' | 'authorization' | 'data' | 'system' | 'workflow' | 'security';
  action?: string;
  resource?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'success' | 'failure' | 'error';
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  organizationId?: string;
  category: string;
  action: string;
  resource: string;
  resourceId?: string;
  severity: string;
  status: string;
  message: string;
  metadata: Record<string, any>;
  riskScore?: number;
  riskFactors?: string[];
  complianceTags?: string[];
}

/**
 * Hook to query audit events
 */
export const useAuditEvents = (query: AuditQuery = {}) => {
  return useQuery({
    queryKey: ['audit', 'events', query],
    queryFn: async () => {
      const response = await fetch(
        '/api/audit/events?' +
          new URLSearchParams(
            Object.entries(query).reduce(
              (acc, [key, value]) => {
                if (value !== undefined) {
                  acc[key] = String(value);
                }
                return acc;
              },
              {} as Record<string, string>
            )
          )
      );

      if (!response.ok) {
        throw new Error('Failed to fetch audit events');
      }

      return response.json();
    },
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Hook to generate compliance reports
 */
export const useGenerateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      reportType: 'compliance' | 'security' | 'activity' | 'risk';
      timeRange: { start: string; end: string };
      filters?: AuditQuery;
      generatedBy: string;
    }) => {
      const response = await fetch('/api/audit/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate audit queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });
};

/**
 * Hook to export audit events
 */
export const useExportAudit = () => {
  return useMutation({
    mutationFn: async (params: { query?: AuditQuery; format?: 'json' | 'csv' | 'xml' }) => {
      const response = await fetch('/api/audit/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error('Failed to export audit data');
      }

      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-export.${params.format || 'json'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    },
  });
};

/**
 * Hook to log audit events (for frontend actions)
 */
export const useLogAuditEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: {
      category: 'authentication' | 'authorization' | 'data' | 'system' | 'workflow' | 'security';
      action: string;
      resource: string;
      resourceId?: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      userId?: string;
      metadata?: Record<string, any>;
    }) => {
      const response = await fetch('/api/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        throw new Error('Failed to log audit event');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate audit queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['audit', 'events'] });
    },
  });
};
