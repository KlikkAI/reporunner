export interface ValidationResult {
  success: boolean;
  valid?: boolean;
  data?: any;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
    value?: any;
  }>;
  meta?: any;
  query?: any;
  body?: any;
  params?: any;
  headers?: any;
  cookies?: any;
  transformed?: any;
}
