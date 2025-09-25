/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeType, INodeTypeDescription } from '../types';

export class ConditionNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Condition',
    name: 'condition',
    icon: '❓',
    group: ['routing'],
    version: 1,
    description: 'Route workflow execution based on conditional logic',
    defaults: {
      name: 'Condition',
      color: '#f59e0b',
    },
    inputs: ['main'],
    outputs: ['main', 'main'],
    properties: [
      {
        displayName: 'Mode',
        name: 'mode',
        type: 'select',
        default: 'expression',
        required: true,
        description: 'How to evaluate the condition',
        options: [
          {
            name: 'Expression',
            value: 'expression',
            description: 'Use a single expression to evaluate',
          },
          {
            name: 'Rules',
            value: 'rules',
            description: 'Use multiple rules with AND/OR logic',
          },
        ],
      },
      {
        displayName: 'Expression',
        name: 'expression',
        type: 'expression',
        default: '{{$json.id > 0}}',
        required: true,
        description: 'Expression that returns true or false',
        displayOptions: {
          show: {
            mode: ['expression'],
          },
        },
      },
      {
        displayName: 'Logic',
        name: 'logic',
        type: 'select',
        default: 'AND',
        description: 'How to combine multiple rules',
        options: [
          { name: 'AND', value: 'AND' },
          { name: 'OR', value: 'OR' },
        ],
        displayOptions: {
          show: {
            mode: ['rules'],
          },
        },
      },
      {
        displayName: 'Rules',
        name: 'rules',
        type: 'collection',
        default: [],
        description: 'Rules to evaluate',
        displayOptions: {
          show: {
            mode: ['rules'],
          },
        },
        values: [
          {
            displayName: 'Field',
            name: 'field',
            type: 'string',
            default: '',
            description: 'Field to check',
            placeholder: 'id',
          },
          {
            displayName: 'Operation',
            name: 'operation',
            type: 'select',
            default: 'equals',
            options: [
              { name: 'Equals', value: 'equals' },
              { name: 'Not Equals', value: 'notEquals' },
              { name: 'Greater Than', value: 'greaterThan' },
              { name: 'Less Than', value: 'lessThan' },
              { name: 'Greater or Equal', value: 'greaterOrEqual' },
              { name: 'Less or Equal', value: 'lessOrEqual' },
              { name: 'Contains', value: 'contains' },
