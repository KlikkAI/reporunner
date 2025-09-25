export interface INodePropertyCollection {
  displayName: string;
  name: string;
  values: INodeProperty[];
}

export interface INodePropertyTypeOptions {
  // Basic Options
  alwaysOpenEditWindow?: boolean;
  password?: boolean;
  rows?: number;
  showAlpha?: boolean;

  // Editor Options
  codeAutocomplete?: string;
  editor?: 'json' | 'javascript' | 'html' | 'css' | 'sql' | 'expression';

  // Number Options
  maxValue?: number;
  minValue?: number;
  numberPrecision?: number;
  numberStepSize?: number;

  // Number-specific options
  numberOptions?: {
    minValue?: number;
    maxValue?: number;
    numberStepSize?: number;
  };

  // Text area options
  textAreaOptions?: {
    rows?: number;
  };

  // Searchable options
  searchable?: boolean;

  // Collection Options
  multipleValues?: boolean;
  multipleValueButtonText?: string;
  sortable?: boolean;

  // Assignment Collection Specific
  assignmentCollection?: {
    autoDetectTypes?: boolean;
    allowedTypes?: string[];
    showTypeSelector?: boolean;
    enableBulkOperations?: boolean;
    enableDragDrop?: boolean;
  };

  // Resource Options
  loadOptions?: {
    routing?: {
      operations?: {
        [key: string]: string;
      };
    };
  };
  loadOptionsMethod?: string;

  // Display Options
  displaySize?: 'small' | 'medium' | 'large';
  placeholder?: string;

  // Validation Options
  validateType?: string;
  validation?: {
    pattern?: string;
    message?: string;
  };

  // Advanced Options
  acceptFileTypes?: string;
  fileExtensions?: string[];
  maxFileSize?: number;

  // Expression Options
  expressionSupport?: boolean;
  resolveExpression?: boolean;

  // Resource Mapper Options
  resourceMapper?: {
    mode: 'add' | 'upsert' | 'update';
    fieldDependencies: string[];
    resourceMapperField: {
      resource: string;
    };
  };

  // Date Time Options
  dateTimePickerOptions?: {
    format?: string;
    showTimeSelect?: boolean;
    timeIntervals?: number;
  };

  // Color Options
  colorOptions?: {
