/**
 * n8n-Compatible Expression Evaluation Engine
 * Complete implementation of n8n's expression syntax and evaluation
 */

// import type { NodeParameterValue } from '../nodes/types'

// Define INodeExecutionData locally to avoid circular imports
interface INodeExecutionData {
  json: Record<string, any>;
  binary?: Record<string, any>;
  pairedItem?: number | { item: number; input?: number };
}

// Expression Context Interfaces
export interface IExpressionContext {
  $json: Record<string, any>;
  $binary?: Record<string, any>;
  $node: Record<string, INodeExecutionData[]>;
  $vars: Record<string, any>;
  $workflow: {
    id: string;
    name: string;
    active: boolean;
  };
  $execution: {
    id: string;
    mode: 'manual' | 'trigger' | 'webhook';
  };
  $now: Date;
  $today: Date;
  $parameter: Record<string, any>;
  $item: (index: number) => INodeExecutionData;
  $items: INodeExecutionData[];
  $position: number;
  $runIndex: number;
  $mode: string;
  $timestamp: number;
}

export interface IExpressionOptions {
  itemIndex?: number;
  runIndex?: number;
  evaluateComplexExpressions?: boolean;
  returnObjectAsString?: boolean;
  timezone?: string;
}

// Expression Type Detection
enum ExpressionType {
  SIMPLE = 'simple', // {{ $json.field }}
  COMPLEX = 'complex', // {{ $json.field1 + $json.field2 }}
  CONDITIONAL = 'conditional', // {{ $json.status === 'active' ? 'enabled' : 'disabled' }}
  FUNCTION_CALL = 'function', // {{ $json.date.toDate() }}
  STRING = 'string', // Regular string, no expression
}

// Built-in Expression Functions
class ExpressionFunctions {
  // Date Functions
  static now(): Date {
    return new Date();
  }

  static today(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  static formatDate(date: Date | string, _format: string = 'yyyy-MM-dd'): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    // Basic date formatting - in production would use a proper date library
    // TODO: Implement actual format support
    return d.toISOString().split('T')[0];
  }

  // String Functions
  static trim(str: string): string {
    return str?.trim() || '';
  }

  static upper(str: string): string {
    return str?.toUpperCase() || '';
  }

  static lower(str: string): string {
    return str?.toLowerCase() || '';
  }

  static length(str: string | any[]): number {
    return str?.length || 0;
  }

  // Math Functions
  static abs(num: number): number {
    return Math.abs(num);
  }

  static round(num: number, decimals: number = 0): number {
    return Number(`${Math.round(parseFloat(`${num}e${decimals}`))}e-${decimals}`);
