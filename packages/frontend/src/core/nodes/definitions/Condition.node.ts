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
              { name: 'Not Contains', value: 'notContains' },
              { name: 'Starts With', value: 'startsWith' },
              { name: 'Ends With', value: 'endsWith' },
              { name: 'Is Empty', value: 'isEmpty' },
              { name: 'Is Not Empty', value: 'isNotEmpty' },
            ],
          },
          {
            displayName: 'Value',
            name: 'value',
            type: 'expression',
            default: '',
            description: 'Value to compare against',
            displayOptions: {
              hide: {
                operation: ['isEmpty', 'isNotEmpty'],
              },
            },
          },
        ],
      },
      {
        displayName: 'Continue on Empty',
        name: 'continueOnEmpty',
        type: 'boolean',
        default: false,
        description:
          'If no input data, send empty data to True output instead of stopping workflow',
      },
    ],
    subtitle:
      '={{$parameter["mode"] === "expression" ? $parameter["expression"] : $parameter["rules"].length + " rules"}}',
    // Custom UI component for specialized condition node rendering
    customBodyComponent: 'ConditionNodeBody',
  };

  async execute(this: any): Promise<any> {
    const mode = this.getNodeParameter('mode', 'expression');
    const inputData = this.getInputData();
    const continueOnEmpty = this.getNodeParameter('continueOnEmpty', false) as boolean;

    // Handle empty input
    if (!inputData.length) {
      if (continueOnEmpty) {
        return [{ json: {} }];
      } else {
        return [];
      }
    }

    const results = {
      true: [] as any[],
      false: [] as any[],
    };

    for (const item of inputData) {
      let conditionResult = false;

      if (mode === 'expression') {
        // Mock evaluation - in real implementation would evaluate expression against item.json
        conditionResult = Math.random() > 0.5; // Random for demo
      } else if (mode === 'rules') {
        const logic = this.getNodeParameter('logic', 'AND') as string;
        const rules = this.getNodeParameter('rules', []) as Array<{
          field: string;
          operation: string;
          value: any;
        }>;

        if (rules.length === 0) {
          conditionResult = true;
        } else {
          const ruleResults = rules.map((rule) => {
            const fieldValue = item.json[rule.field];

            switch (rule.operation) {
              case 'equals':
                return fieldValue == rule.value;
              case 'notEquals':
                return fieldValue != rule.value;
              case 'greaterThan':
                return Number(fieldValue) > Number(rule.value);
              case 'lessThan':
                return Number(fieldValue) < Number(rule.value);
              case 'greaterOrEqual':
                return Number(fieldValue) >= Number(rule.value);
              case 'lessOrEqual':
                return Number(fieldValue) <= Number(rule.value);
              case 'contains':
                return String(fieldValue).includes(String(rule.value));
              case 'notContains':
                return !String(fieldValue).includes(String(rule.value));
              case 'startsWith':
                return String(fieldValue).startsWith(String(rule.value));
              case 'endsWith':
                return String(fieldValue).endsWith(String(rule.value));
              case 'isEmpty':
                return !fieldValue || fieldValue === '';
              case 'isNotEmpty':
                return fieldValue && fieldValue !== '';
              default:
                return false;
            }
          });

          conditionResult =
            logic === 'AND' ? ruleResults.every((r) => r) : ruleResults.some((r) => r);
        }
      }

      if (conditionResult) {
        results.true.push(item);
      } else {
        results.false.push(item);
      }
    }

    return [results.true, results.false];
  }
}
