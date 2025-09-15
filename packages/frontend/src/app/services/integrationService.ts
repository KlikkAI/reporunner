// Integration Management Service - Handle backend integration operations
import { apiClient, ApiClientError } from "@/core/api/ApiClient";
import { ApiResponseSchema } from "@/core/schemas";
import { z } from "zod";

export interface IntegrationStatus {
  connected: boolean;
  config?: Record<string, any>;
  lastConnectedAt?: string;
  connectionHealth?: "healthy" | "warning" | "error";
}

export interface IntegrationConnection {
  integrationId: string;
  config: Record<string, any>;
  credentials?: string[];
}

export class IntegrationService {
  /**
   * Get connection statuses for all integrations
   */
  async getIntegrationStatuses(): Promise<Record<string, IntegrationStatus>> {
    try {
      const response = await apiClient.get(
        "/integrations/status",
        ApiResponseSchema(
          z.record(
            z.string(),
            z.object({
              connected: z.boolean(),
              config: z.record(z.string(), z.any()).optional(),
              lastConnectedAt: z.string().optional(),
              connectionHealth: z
                .enum(["healthy", "warning", "error"])
                .optional(),
            }),
          ),
        ),
      );
      return response;
    } catch (error: any) {
      // If it's a 404, the endpoint doesn't exist yet
      if (error.statusCode === 404) {
        console.warn("Integration status endpoint not implemented yet");
        return {};
      }
      throw new ApiClientError(
        "Failed to get integration statuses",
        0,
        "INTEGRATION_STATUS_ERROR",
        error,
      );
    }
  }

  /**
   * Get status for specific integration
   */
  async getIntegrationStatus(
    integrationId: string,
  ): Promise<IntegrationStatus> {
    try {
      const response = await apiClient.get(
        `/integrations/${integrationId}/status`,
        ApiResponseSchema(
          z.object({
            connected: z.boolean(),
            config: z.record(z.string(), z.any()).optional(),
            lastConnectedAt: z.string().optional(),
            connectionHealth: z
              .enum(["healthy", "warning", "error"])
              .optional(),
          }),
        ),
      );
      return response;
    } catch (error) {
      throw new ApiClientError(
        "Failed to get integration status",
        0,
        "INTEGRATION_STATUS_ERROR",
        error,
      );
    }
  }

  /**
   * Connect an integration with configuration
   */
  async connectIntegration(
    integrationId: string,
    config: Record<string, any>,
  ): Promise<{ message: string }> {
    try {
      return await apiClient.post(
        "/integrations/connect",
        {
          integrationId,
          config,
        },
        ApiResponseSchema(z.object({ message: z.string() })),
      );
    } catch (error) {
      throw new ApiClientError(
        "Failed to connect integration",
        0,
        "INTEGRATION_CONNECT_ERROR",
        error,
      );
    }
  }

  /**
   * Disconnect an integration
   */
  async disconnectIntegration(
    integrationId: string,
  ): Promise<{ message: string }> {
    try {
      return await apiClient.delete(
        `/integrations/${integrationId}/connection`,
        ApiResponseSchema(z.object({ message: z.string() })),
      );
    } catch (error) {
      throw new ApiClientError(
        "Failed to disconnect integration",
        0,
        "INTEGRATION_DISCONNECT_ERROR",
        error,
      );
    }
  }

  /**
   * Test integration connection
   */
  async testIntegrationConnection(integrationId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      return await apiClient.post(
        `/integrations/${integrationId}/test`,
        {},
        ApiResponseSchema(
          z.object({
            success: z.boolean(),
            message: z.string(),
            details: z.any().optional(),
          }),
        ),
      );
    } catch (error) {
      throw new ApiClientError(
        "Failed to test integration connection",
        0,
        "INTEGRATION_TEST_ERROR",
        error,
      );
    }
  }

  /**
   * Get available integrations from backend
   */
  async getAvailableIntegrations(): Promise<any[]> {
    try {
      return await apiClient.get(
        "/integrations/available",
        ApiResponseSchema(z.array(z.any())), // Adjust schema as needed
      );
    } catch (error) {
      throw new ApiClientError(
        "Failed to get available integrations",
        0,
        "INTEGRATION_FETCH_ERROR",
        error,
      );
    }
  }

  /**
   * Get integration configuration requirements
   */
  async getIntegrationConfig(integrationId: string): Promise<{
    fields: any[];
    instructions?: string[];
    links?: any[];
  }> {
    try {
      return await apiClient.get(
        `/integrations/${integrationId}/config`,
        ApiResponseSchema(
          z.object({
            fields: z.array(z.any()), // Adjust schema as needed
            instructions: z.array(z.string()).optional(),
            links: z.array(z.any()).optional(),
          }),
        ),
      );
    } catch (error) {
      throw new ApiClientError(
        "Failed to get integration configuration",
        0,
        "INTEGRATION_CONFIG_ERROR",
        error,
      );
    }
  }
}

export const integrationService = new IntegrationService();
