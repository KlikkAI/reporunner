/**
 * Standard API response interface
 */
export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  meta?: any;
  errors?: string[];
}

/**
 * Pagination parameters interface
 */
export interface IPaginationParams {
  page: number;
  limit: number;
  skip?: number;
}

/**
 * Pagination result interface
 */
export interface IPaginationResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Service operation result interface
 */
export interface IServiceResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Test result interface for credential testing
 */
export interface ITestResult {
  success: boolean;
  message: string;
  details: Record<string, any>;
}
