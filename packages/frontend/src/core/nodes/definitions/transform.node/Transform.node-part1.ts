/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeType, INodeTypeDescription } from '../types';

// Enhanced Transform node interfaces
export interface IFieldAssignment {
  name: string;
  type: 'stringValue' | 'numberValue' | 'booleanValue' | 'arrayValue' | 'objectValue' | 'dateValue';
  stringValue?: string;
  numberValue?: number;
  booleanValue?: boolean;
  arrayValue?: string | any[];
  objectValue?: string | object;
  dateValue?: string;
}

export interface ITransformOptions {
  includeInputFields: 'all' | 'none' | 'selected' | 'except';
  selectedInputFields?: string[];
  dotNotation: boolean;
  ignoreConversionErrors: boolean;
  keepOnlySet?: boolean;
  enableCaching?: boolean;
  batchSize?: number;
  dateFormat?: string;
}

type TransformMode = 'manual' | 'json';

export class TransformNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Transform',
    name: 'transform',
    icon: '🔄',
    group: ['transform'],
    version: 2, // Use single version number
    subtitle:
      '={{$parameter["mode"] === "manual" ? ($parameter["assignments"]["values"] ? $parameter["assignments"]["values"].length + " assignments" : "0 assignments") : "JSON mode"}}',
    description:
      'Transform and manipulate data with advanced field operations, type validation, expression evaluation, and flexible input handling - full n8n EditFields compatibility',
    defaults: {
      name: 'Transform',
      color: '#14b8a6',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      // Mode Selection
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'select',
        default: 'manual',
        required: true,
        description: 'Choose the transformation mode',
        options: [
          {
            name: 'Manual Field Assignment',
            value: 'manual',
            description: 'Configure individual field transformations with type validation',
          },
          {
            name: 'JSON Object',
            value: 'json',
            description: 'Define transformations using a JSON object',
          },
        ],
      },

      // Manual Mode Properties
      {
        displayName: 'Include Input Fields',
        name: 'includeInputFields',
        type: 'select',
        default: 'all',
        description: 'Choose which input fields to include in the output',
        displayOptions: {
          show: {
            mode: ['manual'],
          },
        },
        options: [
          {
            name: 'Include All Input Fields',
            value: 'all',
            description: 'Include all input fields plus new assignments',
          },
          {
            name: 'Include No Input Fields',
            value: 'none',
            description: 'Only include the assigned fields',
          },
          {
            name: 'Include Selected Input Fields',
            value: 'selected',
            description: 'Only include specified input fields plus assignments',
          },
          {
            name: 'Include All Except Selected',
            value: 'except',
            description: 'Include all input fields except specified ones',
