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
  PropertyFormState,
  PropertyValue,
} from "../types/dynamicProperties";
import type { NodeProperty as INodeProperty } from "../types/dynamicProperties";

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
  operator:
    | "equals"
    | "notEquals"
    | "in"
    | "notIn"
    | "exists"
    | "empty"
    | "regex";
  value?: any;
  ignoreCase?: boolean;
}

export interface ValidationRule {
  type: "required" | "minLength" | "maxLength" | "pattern" | "custom";
  value?: any;
  message: string;
  validator?: (value: PropertyValue, formState: PropertyFormState) => boolean;
}

export interface EnhancedNodeProperty
  extends Omit<INodeProperty, "displayOptions"> {
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
  affects?: string[];

  // AI assistance
  aiSuggestions?: boolean;
  aiPrompt?: string;

  // Expression support
  expressionSupport?: boolean;
  expressionLanguage?: "javascript" | "jsonpath" | "n8n";

  // Dynamic properties
  isDynamic?: boolean;
  dynamicLoadOptions?: {
    endpoint: string;
    method: "GET" | "POST";
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

    // Check cache first
    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    const evaluation = this.performEvaluation(property);
    this.validationCache.set(cacheKey, evaluation);

    return evaluation;
  }

  /**
   * Evaluate multiple properties and resolve dependencies
   */
  evaluateProperties(
    properties: EnhancedNodeProperty[],
  ): Map<string, EnhancedPropertyEvaluation> {
    this.buildDependencyGraph(properties);
    const results = new Map<string, EnhancedPropertyEvaluation>();

    // Sort properties by dependency order
    const sortedProperties = this.topologicalSort(properties);

    for (const property of sortedProperties) {
      const evaluation = this.evaluateProperty(property);
      results.set(property.name, evaluation);

      // Update form state if property has a default value
      if (
        evaluation.defaultValue !== undefined &&
        this.formState[property.name] === undefined
      ) {
        this.formState[property.name] = evaluation.defaultValue;
      }
    }

    return results;
  }

  /**
   * Validate all properties and return error summary
   */
  async validateAllProperties(properties: EnhancedNodeProperty[]): Promise<{
    isValid: boolean;
    errors: Map<string, string>;
    warnings: Map<string, string>;
  }> {
    const errors = new Map<string, string>();
    const warnings = new Map<string, string>();

    for (const property of properties) {
      const evaluation = this.evaluateProperty(property);

      if (evaluation.error) {
        errors.set(property.name, evaluation.error);
      }

      if (evaluation.warning) {
        warnings.set(property.name, evaluation.warning);
      }

      // Async validation removed to align with base types
    }

    return {
      isValid: errors.size === 0,
      errors,
      warnings,
    };
  }

  /**
   * Get properties that depend on a specific property
   */
  getDependentProperties(propertyName: string): string[] {
    return Array.from(this.dependencyGraph.get(propertyName) || []);
  }

  /**
   * Clear validation cache (call when form state changes)
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Update form state and invalidate cache
   */
  updateFormState(updates: Partial<PropertyFormState>): void {
    this.formState = { ...this.formState, ...updates };
    this.clearCache();
  }

  private performEvaluation(
    property: EnhancedNodeProperty,
  ): EnhancedPropertyEvaluation {
    const currentValue = this.formState[property.name];

    // Start with default evaluation
    let evaluation: EnhancedPropertyEvaluation = {
      visible: true,
      disabled: false,
      required: property.required || false,
    };

    // Evaluate display conditions
    evaluation = this.evaluateDisplayConditions(property, evaluation);

    // Evaluate validation rules
    evaluation = this.evaluateValidationRules(
      property,
      currentValue,
      evaluation,
    );

    // Generate AI suggestions if enabled
    if (property.aiSuggestions) {
      evaluation.suggestion = this.generateAISuggestion(property, currentValue);
    }

    // Calculate default value if needed
    if (currentValue === undefined || currentValue === null) {
      evaluation.defaultValue = this.calculateDefaultValue(property);
    }

    return evaluation;
  }

  private evaluateDisplayConditions(
    property: EnhancedNodeProperty,
    evaluation: EnhancedPropertyEvaluation,
  ): EnhancedPropertyEvaluation {
    const displayOptions = property.displayOptions;

    if (!displayOptions) {
      return evaluation;
    }

    // Evaluate show conditions
    if (displayOptions.show) {
      evaluation.visible = this.evaluateDependencies(displayOptions.show);
    }

    // Evaluate hide conditions
    if (displayOptions.hide) {
      const shouldHide = this.evaluateDependencies(displayOptions.hide);
      if (shouldHide) {
        evaluation.visible = false;
      }
    }

    // Evaluate enable conditions
    if (displayOptions.enable) {
      evaluation.disabled = !this.evaluateDependencies(displayOptions.enable);
    }

    // Evaluate disable conditions
    if (displayOptions.disable) {
      const shouldDisable = this.evaluateDependencies(displayOptions.disable);
      if (shouldDisable) {
        evaluation.disabled = true;
      }
    }

    return evaluation;
  }

  private evaluateDependencies(dependencies: PropertyDependency[]): boolean {
    return dependencies.every((dep) => this.evaluateDependency(dep));
  }

  private evaluateDependency(dependency: PropertyDependency): boolean {
    const currentValue = this.formState[dependency.property];

    switch (dependency.operator) {
      case "equals":
        return this.compareValues(
          currentValue,
          dependency.value,
          dependency.ignoreCase,
        );

      case "notEquals":
        return !this.compareValues(
          currentValue,
          dependency.value,
          dependency.ignoreCase,
        );

      case "in":
        return (
          Array.isArray(dependency.value) &&
          dependency.value.some((val) =>
            this.compareValues(currentValue, val, dependency.ignoreCase),
          )
        );

      case "notIn":
        return (
          !Array.isArray(dependency.value) ||
          !dependency.value.some((val) =>
            this.compareValues(currentValue, val, dependency.ignoreCase),
          )
        );

      case "exists":
        return currentValue !== undefined && currentValue !== null;

      case "empty":
        return (
          currentValue === undefined ||
          currentValue === null ||
          currentValue === ""
        );

      case "regex":
        if (
          typeof dependency.value === "string" &&
          typeof currentValue === "string"
        ) {
          const regex = new RegExp(
            dependency.value,
            dependency.ignoreCase ? "i" : "",
          );
          return regex.test(currentValue);
        }
        return false;

      default:
        return true;
    }
  }

  private compareValues(value1: any, value2: any, ignoreCase = false): boolean {
    if (
      ignoreCase &&
      typeof value1 === "string" &&
      typeof value2 === "string"
    ) {
      return value1.toLowerCase() === value2.toLowerCase();
    }
    return value1 === value2;
  }

  private evaluateValidationRules(
    property: EnhancedNodeProperty,
    currentValue: PropertyValue,
    evaluation: EnhancedPropertyEvaluation,
  ): EnhancedPropertyEvaluation {
    if (!property.validation) {
      return evaluation;
    }

    for (const rule of property.validation) {
      const error = this.validateRule(rule, currentValue, property);
      if (error) {
        evaluation.error = error;
        break; // Stop at first error
      }
    }

    return evaluation;
  }

  private validateRule(
    rule: ValidationRule,
    value: PropertyValue,
    property: EnhancedNodeProperty,
  ): string | null {
    switch (rule.type) {
      case "required":
        if (value === undefined || value === null || value === "") {
          return (
            rule.message ||
            `${property.displayName || property.name} is required`
          );
        }
        break;

      case "minLength":
        if (typeof value === "string" && value.length < (rule.value || 0)) {
          return rule.message || `Minimum length is ${rule.value}`;
        }
        break;

      case "maxLength":
        if (
          typeof value === "string" &&
          value.length > (rule.value || Infinity)
        ) {
          return rule.message || `Maximum length is ${rule.value}`;
        }
        break;

      case "pattern":
        if (typeof value === "string" && typeof rule.value === "string") {
          const regex = new RegExp(rule.value);
          if (!regex.test(value)) {
            return rule.message || "Invalid format";
          }
        }
        break;

      case "custom":
        if (rule.validator && !rule.validator(value, this.formState)) {
          return rule.message || "Validation failed";
        }
        break;
    }

    return null;
  }

  private generateAISuggestion(
    property: EnhancedNodeProperty,
    currentValue: PropertyValue,
  ): string | undefined {
    // Generate contextual AI suggestions based on property type and current value
    if (!property.aiPrompt && !currentValue) {
      // Generate default suggestions based on property type
      switch (property.type) {
        case "string":
          if (property.name.toLowerCase().includes("prompt")) {
            return 'Try: "Analyze the following data and provide insights..."';
          }
          if (property.name.toLowerCase().includes("subject")) {
            return 'Try: "Important update from your workflow"';
          }
          if (property.name.toLowerCase().includes("message")) {
            return 'Try: "Here are the results from your automation..."';
          }
          break;

        case "select":
          if (property.options && property.options.length > 0) {
            const firstOption = property.options[0];
            return `Suggested: ${typeof firstOption === "object" ? firstOption.value : firstOption}`;
          }
          break;

        case "number":
          if (property.name.toLowerCase().includes("temperature")) {
            return "Suggested: 0.7 (balanced creativity)";
          }
          if (property.name.toLowerCase().includes("token")) {
            return "Suggested: 1000 (moderate length)";
          }
          if (property.name.toLowerCase().includes("timeout")) {
            return "Suggested: 30000 (30 seconds)";
          }
          break;

        case "boolean":
          return "Suggested: true (enabled)";
      }
    }

    // Use custom AI prompt if available
    if (property.aiPrompt) {
      return `AI Suggestion: ${property.aiPrompt}`;
    }

    // Contextual suggestions based on current value
    if (currentValue) {
      if (property.type === "string" && typeof currentValue === "string") {
        if (
          currentValue.length < 10 &&
          property.name.toLowerCase().includes("prompt")
        ) {
          return "Consider adding more detail to improve AI responses";
        }
      }
    }

    return undefined;
  }

  private calculateDefaultValue(
    property: EnhancedNodeProperty,
  ): PropertyValue | undefined {
    // Use existing default if available
    if (property.default !== undefined) {
      return property.default;
    }

    // Generate smart defaults based on property type
    switch (property.type) {
      case "string":
        return "";
      case "number":
        return 0;
      case "boolean":
        return false;
      case "select":
      case "multiSelect":
        return [];
      case "collection":
        return undefined;
      case "fixedCollection":
        return undefined;
      default:
        return undefined;
    }
  }

  private buildDependencyGraph(properties: EnhancedNodeProperty[]): void {
    this.dependencyGraph.clear();

    properties.forEach((property) => {
      const dependencies = this.extractDependencies(property);
      dependencies.forEach((dep) => {
        if (!this.dependencyGraph.has(dep)) {
          this.dependencyGraph.set(dep, new Set());
        }
        this.dependencyGraph.get(dep)!.add(property.name);
      });
    });
  }

  private extractDependencies(property: EnhancedNodeProperty): string[] {
    const dependencies = new Set<string>();

    // Extract from display options
    if (property.displayOptions) {
      ["show", "hide", "enable", "disable"].forEach((key) => {
        const conditions = (property.displayOptions as any)?.[key];
        if (Array.isArray(conditions)) {
          conditions.forEach((dep: PropertyDependency) => {
            dependencies.add(dep.property);
          });
        }
      });
    }

    // Extract from explicit dependencies
    if (property.dependencies) {
      property.dependencies.forEach((dep) => dependencies.add(dep));
    }

    return Array.from(dependencies);
  }

  private topologicalSort(
    properties: EnhancedNodeProperty[],
  ): EnhancedNodeProperty[] {
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const result: EnhancedNodeProperty[] = [];
    const propertyMap = new Map(properties.map((p) => [p.name, p]));

    const visit = (propertyName: string) => {
      if (visiting.has(propertyName)) {
        // Circular dependency detected, skip for now
        return;
      }

      if (visited.has(propertyName)) {
        return;
      }

      visiting.add(propertyName);

      const dependencies = this.extractDependencies(
        propertyMap.get(propertyName)!,
      );
      dependencies.forEach((dep) => {
        if (propertyMap.has(dep)) {
          visit(dep);
        }
      });

      visiting.delete(propertyName);
      visited.add(propertyName);

      const property = propertyMap.get(propertyName);
      if (property) {
        result.push(property);
      }
    };

    properties.forEach((property) => {
      if (!visited.has(property.name)) {
        visit(property.name);
      }
    });

    return result;
  }

  private getCacheKey(property: EnhancedNodeProperty): string {
    // Create a cache key that includes property name and relevant form state
    const dependencies = this.extractDependencies(property);
    const relevantState = dependencies.reduce(
      (acc, dep) => {
        acc[dep] = this.formState[dep];
        return acc;
      },
      {} as Record<string, any>,
    );

    return `${property.name}:${JSON.stringify(relevantState)}`;
  }
}

/**
 * Hook for using enhanced property evaluation in React components
 */
export function useEnhancedPropertyEvaluator(
  properties: EnhancedNodeProperty[],
  formState: PropertyFormState,
  executionContext: any = {},
) {
  const [evaluator] = React.useState(
    () => new EnhancedPropertyEvaluator(formState, executionContext),
  );
  const [evaluations, setEvaluations] = React.useState<
    Map<string, EnhancedPropertyEvaluation>
  >(new Map());

  React.useEffect(() => {
    evaluator.updateFormState(formState);
    const newEvaluations = evaluator.evaluateProperties(properties);
    setEvaluations(newEvaluations);
  }, [properties, formState, evaluator]);

  const validateAll = React.useCallback(async () => {
    return evaluator.validateAllProperties(properties);
  }, [evaluator, properties]);

  const getDependents = React.useCallback(
    (propertyName: string) => {
      return evaluator.getDependentProperties(propertyName);
    },
    [evaluator],
  );

  return {
    evaluations,
    validateAll,
    getDependents,
    evaluator,
  };
}

// Import React for the hook
import React from "react";
