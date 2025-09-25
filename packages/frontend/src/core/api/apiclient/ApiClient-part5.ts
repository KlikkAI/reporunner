try {
  const response = await this.client.get('/health');
  return {
        status: response.data?.status || 'ok',
        timestamp: new Date().toISOString(),
      };
} catch (error) {
  throw new ApiClientError('Health check failed', 0, 'HEALTH_CHECK_ERROR', error);
}
}

  /**
   * Update configuration (useful for switching environments)
   */
  updateConfig(newConfig: Partial<
{
  baseURL: string;
  timeout: number;
}
>): void
{
  if (newConfig.baseURL) {
    this.client.defaults.baseURL = newConfig.baseURL;
  }
  if (newConfig.timeout) {
    this.client.defaults.timeout = newConfig.timeout;
  }
}
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for external use
export type { ApiResponse, ApiError, PaginationParams, PaginatedResponse };
