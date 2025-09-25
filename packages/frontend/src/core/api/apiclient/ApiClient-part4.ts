schema: ZodSchema<ApiResponse<T>>,
    config?: AxiosRequestConfig
): Promise<T>
{
  try {
    const response = await this.client.patch(endpoint, data, config);
    return this.validateAndExtractData(response, schema);
  } catch (error) {
    throw this.handleRequestError(error);
  }
}

/**
 * Generic DELETE request with schema validation
 */
async;
delete<T>(
    endpoint
: string,
    schema: ZodSchema<ApiResponse<T>>,
    config?: AxiosRequestConfig
  ): Promise<T>
{
  try {
    const response = await this.client.delete(endpoint, config);
    return this.validateAndExtractData(response, schema);
  } catch (error) {
    throw this.handleRequestError(error);
  }
}

/**
 * Paginated GET request
 */
async;
getPaginated<T>(
    endpoint: string,
    schema: ZodSchema<ApiResponse<PaginatedResponse<T>>>,
    params?: PaginationParams & Record<string, unknown>
  )
: Promise<PaginatedResponse<T>>
{
  return this.get(endpoint, schema, { params });
}

/**
 * Validate response against schema and extract data
 */
private
validateAndExtractData<T>(response: AxiosResponse, schema: ZodSchema<ApiResponse<T>>)
: T
{
  try {
    // First validate the response structure
    const validatedResponse = schema.parse(response.data);

    // Check if the API response indicates success
    if (!validatedResponse.success) {
      throw new ApiClientError(
        validatedResponse.message || 'API request failed',
        response.status,
        'API_ERROR',
        validatedResponse.errors
      );
    }

    return validatedResponse.data;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const validationError = new Error('Response validation failed');
      logger.error('API Response Validation Failed', validationError);
      logger.info('Validation Error Details', {
        validationErrors: error.issues,
        responseData: response.data,
      });

      throw new ValidationError('Response validation failed', error);
    }
    throw error;
  }
}

/**
 * Handle request errors and convert to ApiClientError
 */
private
handleRequestError(error: unknown)
: ApiClientError
{
  if (error instanceof ApiClientError) {
    return error;
  }

  if (error instanceof ValidationError) {
    return error;
  }

  // Handle unknown errors
  const message = error instanceof Error ? error.message : 'Unknown error occurred';
  return new ApiClientError(message, 0, 'UNKNOWN_ERROR', error);
}

/**
 * Raw request method for special cases (bypasses validation)
 */
async;
raw<T = unknown>(config
: AxiosRequestConfig): Promise<AxiosResponse<T>>
{
  return this.client.request(config);
}

/**
 * Health check endpoint
 */
async;
healthCheck();
: Promise<
{
  status: string;
  timestamp: string;
}
>
{
