/**
 * Enhanced Property Evaluation System
 *
 * Provides sophisticated property evaluation with support for:
 * - Complex conditional logic
 * - Nested property dependencies
 * - Real-time validation
 * - AI-assisted property suggestions
 * - Expression evaluation
 */

import type {
  NodeProperty as INodeProperty,
  PropertyFormState,
  PropertyValue,
} from '../types/dynamicProperties';

export interface EnhancedPropertyEvaluation {
  visible: boolean;
  disabled: boolean;
  required: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
  defaultValue?: PropertyValue;
}

export interface PropertyDependency {
  property: string;
  operator: 'equals' | 'notEquals' | 'in' | 'notIn' | 'exists' | 'empty' | 'regex';
  value?: any;
  ignoreCase?: boolean;
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: any;
  message: string;
  validator?: (value: PropertyValue, formState: PropertyFormState) => boolean;
}

export interface EnhancedNodeProperty
  extends Omit<INodeProperty, 'displayOptions' | 'expressionSupport'> {
  // Enhanced display options (separate from base DisplayOptions)
  displayOptions?: {
    show?: PropertyDependency[];
    hide?: PropertyDependency[];
    enable?: PropertyDependency[];
    disable?: PropertyDependency[];
  };

  // Advanced validation
  validation?: ValidationRule[];

  // Property relationships
  dependencies?: string[];

  // Expression support (compatible with base interface)
  expressionSupport?: 'none' | 'full' | 'partial';
  affects?: string[];

  // AI assistance
  aiSuggestions?: boolean;
  aiPrompt?: string;

  // Expression language (additional property not in base interface)
  expressionLanguage?: 'javascript' | 'jsonpath' | 'n8n';

  // Dynamic properties
  isDynamic?: boolean;
  dynamicLoadOptions?: {
    endpoint: string;
    method: 'GET' | 'POST';
    params?: Record<string, any>;
    dependsOn?: string[];
  };

  // Conditional properties
  conditionalProperties?: {
    condition: PropertyDependency[];
    properties: EnhancedNodeProperty[];
  }[];
}

export class EnhancedPropertyEvaluator {
  private formState: PropertyFormState;
  private validationCache: Map<string, EnhancedPropertyEvaluation>;
  private dependencyGraph: Map<string, Set<string>>;

  constructor(formState: PropertyFormState, _executionContext: any = {}) {
    this.formState = formState;
    this.validationCache = new Map();
    this.dependencyGraph = new Map();
  }

  /**
   * Evaluate a property with enhanced logic
   */
  evaluateProperty(property: EnhancedNodeProperty): EnhancedPropertyEvaluation {
    const cacheKey = this.getCacheKey(property);
