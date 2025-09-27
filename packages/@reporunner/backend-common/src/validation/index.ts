// Validation exports - avoiding cross-package direct imports to fix TypeScript rootDir issues

// Basic validation interfaces that can be used within backend-common
export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

// Note: For full validation functionality, import from @reporunner/validation as a built package