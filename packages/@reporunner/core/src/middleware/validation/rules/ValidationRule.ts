export interface ValidationRule {
  field: string;
  required?: boolean;
  type?: string;
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
  applies?: (context: any) => boolean;
  validate?: (value: any, context: any) => any;
}
