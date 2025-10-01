/**
 * Conditional Property Rendering System
 * Advanced displayOptions evaluation matching n8n's complex conditional logic
 */

import React, { useMemo } from 'react';
import type { INodeProperty } from '@/core/nodes/types';
import type { PropertyEvaluationContext, PropertyFormState, PropertyValue } from '@/core/types/dynamicProperties';
import DynamicPropertyRenderer from '../../components/WorkflowEditor/DynamicPropertyRenderer';
import type { PropertyRendererProps } from './PropertyRenderers';

// Define display options interface locally
interface INodePropertyDisplayOptions {
  show?: Record<string, any[]>;
  hide?: Record<string, any[]>;
}

// Enhanced Display Options Interface
export interface EnhancedDisplayOptions extends INodePropertyDisplayOptions {
  show?: Record<string, any[]>;
  hide?: Record<string, any[]>;
  // Advanced conditional operators
  showIf?: {
    field: string;
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'not_contains'
      | 'greater_than'
      | 'less_than'
      | 'is_empty'
      | 'is_not_empty';
    value: any;
  }[];
  hideIf?: {
    field: string;
    operator:
      | 'equals'
      | 'not_equals'
      | 'contains'
      | 'not_contains'
      | 'greater_than'
      | 'less_than'
      | 'is_empty'
      | 'is_not_empty';
    value: any;
  }[];
  // Nested conditions with AND/OR logic
  conditions?: {
    type: 'AND' | 'OR';
    rules: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  // Resource-dependent visibility
  resourceDependent?: {
    resource: string;
    condition: (resource: any) => boolean;
  };
}

export interface ConditionalPropertyRendererProps extends Omit<PropertyRendererProps, 'property'> {
  property: INodeProperty & {
    displayOptions?: EnhancedDisplayOptions;
  };
  nodeValues: Record<string, any>;
}

// Conditional Logic Evaluator
class DisplayOptionsEvaluator {
  private nodeValues: Record<string, any>;

  constructor(nodeValues: Record<string, any>) {
    this.nodeValues = nodeValues;
  }

  // Main evaluation method
  evaluateDisplayOptions(displayOptions: EnhancedDisplayOptions): {
    visible: boolean;
    disabled: boolean;
    required: boolean;
  } {
    let visible = true;
    const disabled = false;
    const required = false;

    // Basic show/hide conditions (n8n standard)
    if (displayOptions.show) {
      visible = this.evaluateShowConditions(displayOptions.show);
    }

    if (displayOptions.hide && visible) {
      visible = !this.evaluateHideConditions(displayOptions.hide);
    }

    // Advanced conditional logic
    if (displayOptions.showIf && visible) {
      visible = this.evaluateAdvancedConditions(displayOptions.showIf);
    }

    if (displayOptions.hideIf && visible) {
      visible = !this.evaluateAdvancedConditions(displayOptions.hideIf);
    }

    // Complex nested conditions
    if (displayOptions.conditions && visible) {
      visible = this.evaluateNestedConditions(displayOptions.conditions);
    }

    // Resource-dependent visibility
    if (displayOptions.resourceDependent && visible) {
      visible = this.evaluateResourceDependentConditions(displayOptions.resourceDependent);
    }

    return { visible, disabled, required };
  }

  // Standard n8n show conditions
  private evaluateShowConditions(showConditions: Record<string, any[]>): boolean {
    return Object.entries(showConditions).every(([fieldName, expectedValues]) => {
      const currentValue = this.getFieldValue(fieldName);
      return this.matchesAnyValue(currentValue, expectedValues);
    });
  }

  // Standard n8n hide conditions
  private evaluateHideConditions(hideConditions: Record<string, any[]>): boolean {
    return Object.entries(hideConditions).some(([fieldName, expectedValues]) => {
      const currentValue = this.getFieldValue(fieldName);
      return this.matchesAnyValue(currentValue, expectedValues);
    });
  }

  // Advanced conditional logic with operators
  private evaluateAdvancedConditions(
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>
  ): boolean {
    return conditions.every((condition) => {
      const fieldValue = this.getFieldValue(condition.field);
      return this.evaluateCondition(fieldValue, condition.operator, condition.value);
    });
  }

  // Nested conditions with AND/OR logic
  private evaluateNestedConditions(conditions: {
    type: 'AND' | 'OR';
    rules: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  }): boolean {
    const results = conditions.rules.map((rule) => {
      const fieldValue = this.getFieldValue(rule.field);
      return this.evaluateCondition(fieldValue, rule.operator, rule.value);
    });

    return conditions.type === 'AND'
      ? results.every((result) => result)
      : results.some((result) => result);
  }

  // Resource-dependent conditions
  private evaluateResourceDependentConditions(resourceDependent: {
    resource: string;
    condition: (resource: any) => boolean;
  }): boolean {
    const resource = this.getFieldValue(resourceDependent.resource);
    try {
      return resourceDependent.condition(resource);
    } catch (_error) {
      return false;
    }
  }

  // Single condition evaluation with operators
  private evaluateCondition(fieldValue: any, operator: string, expectedValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === expectedValue;
      case 'not_equals':
        return fieldValue !== expectedValue;
      case 'contains':
        return this.valueContains(fieldValue, expectedValue);
      case 'not_contains':
        return !this.valueContains(fieldValue, expectedValue);
      case 'greater_than':
        return Number(fieldValue) > Number(expectedValue);
      case 'less_than':
        return Number(fieldValue) < Number(expectedValue);
      case 'is_empty':
        return this.isEmpty(fieldValue);
      case 'is_not_empty':
        return !this.isEmpty(fieldValue);
      case 'starts_with':
        return String(fieldValue).startsWith(String(expectedValue));
      case 'ends_with':
        return String(fieldValue).endsWith(String(expectedValue));
      case 'matches_regex':
        try {
          return new RegExp(String(expectedValue)).test(String(fieldValue));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  // Helper: Check if value matches any of the expected values
  private matchesAnyValue(currentValue: any, expectedValues: any[]): boolean {
    return expectedValues.some((expectedValue) => {
      // Handle array values
      if (Array.isArray(currentValue)) {
        return currentValue.includes(expectedValue);
      }

      // Handle object values
      if (typeof currentValue === 'object' && currentValue !== null) {
        return JSON.stringify(currentValue) === JSON.stringify(expectedValue);
      }

      // Standard equality check
      return currentValue === expectedValue;
    });
  }

  // Helper: Check if value contains expected value
  private valueContains(fieldValue: any, expectedValue: any): boolean {
    if (Array.isArray(fieldValue)) {
      return fieldValue.includes(expectedValue);
    }

    if (typeof fieldValue === 'string' && typeof expectedValue === 'string') {
      return fieldValue.toLowerCase().includes(expectedValue.toLowerCase());
    }

    if (typeof fieldValue === 'object' && fieldValue !== null) {
      return JSON.stringify(fieldValue).includes(String(expectedValue));
    }

    return false;
  }

  // Helper: Check if value is empty
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    if (typeof value === 'string') {
      return value.trim() === '';
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    return false;
  }

  // Helper: Get field value with dot notation support
  private getFieldValue(fieldPath: string): any {
    // Handle dot notation: 'operation.type' -> operation.type
    const pathParts = fieldPath.split('.');
    let value = this.nodeValues;

    for (const part of pathParts) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }
}

// Property Dependency Tracker
class PropertyDependencyTracker {
  private dependencies = new Map<string, Set<string>>();

  // Register that a property depends on other fields
  registerDependency(propertyName: string, dependsOn: string[]): void {
    if (!this.dependencies.has(propertyName)) {
      this.dependencies.set(propertyName, new Set());
    }

    const deps = this.dependencies.get(propertyName)!;
    dependsOn.forEach((dep) => deps.add(dep));
  }

  // Get all properties that depend on a given field
  getDependents(fieldName: string): string[] {
    const dependents: string[] = [];

    this.dependencies.forEach((deps, propertyName) => {
      if (deps.has(fieldName)) {
        dependents.push(propertyName);
      }
    });

    return dependents;
  }

  // Extract dependencies from display options
  extractDependencies(_propertyName: string, displayOptions: EnhancedDisplayOptions): string[] {
    const dependencies = new Set<string>();

    // Extract from show/hide conditions
    if (displayOptions.show) {
      Object.keys(displayOptions.show).forEach((field) => dependencies.add(field));
    }

    if (displayOptions.hide) {
      Object.keys(displayOptions.hide).forEach((field) => dependencies.add(field));
    }

    // Extract from advanced conditions
    if (displayOptions.showIf) {
      displayOptions.showIf.forEach((condition) => dependencies.add(condition.field));
    }

    if (displayOptions.hideIf) {
      displayOptions.hideIf.forEach((condition) => dependencies.add(condition.field));
    }

    // Extract from nested conditions
    if (displayOptions.conditions) {
      displayOptions.conditions.rules.forEach((rule) => dependencies.add(rule.field));
    }

    return Array.from(dependencies);
  }
}

export { DisplayOptionsEvaluator, PropertyDependencyTracker };

/**
 * Property Group Renderer with Conditional Display Logic
 *
 * Renders a group of properties with advanced conditional visibility evaluation.
 * Uses DisplayOptionsEvaluator to determine which properties should be shown.
 */
export interface PropertyGroupRendererProps {
  properties: Array<INodeProperty & { displayOptions?: EnhancedDisplayOptions }>;
  values: PropertyFormState;
  onChange: (name: string, value: PropertyValue) => void;
  evaluationContext?: Record<string, any>;
  context?: Partial<PropertyEvaluationContext>;
  disabled?: boolean;
  theme?: 'light' | 'dark';
}

export const PropertyGroupRenderer: React.FC<PropertyGroupRendererProps> = ({
  properties,
  values,
  onChange,
  evaluationContext: _evaluationContext = {},
  context,
  disabled = false,
  theme = 'dark',
}) => {
  // Evaluate which properties should be visible
  const visibleProperties = useMemo(() => {
    const evaluator = new DisplayOptionsEvaluator(values);

    return properties.filter((property) => {
      // If no display options, always show
      if (!property.displayOptions) {
        return true;
      }

      // Evaluate display options
      const evaluation = evaluator.evaluateDisplayOptions(property.displayOptions);
      return evaluation.visible && !evaluation.disabled;
    });
  }, [properties, values]);

  // Render visible properties using DynamicPropertyRenderer
  return (
    <div className="space-y-4">
      <DynamicPropertyRenderer
        properties={visibleProperties as INodeProperty[]}
        formState={values}
        onChange={onChange}
        context={context}
        disabled={disabled}
        theme={theme}
      />
    </div>
  );
};
