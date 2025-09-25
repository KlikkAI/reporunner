import { describe, expect, it } from 'vitest';
import type { WorkflowNodeInstance } from '@/core';

describe('Lean Workflow Architecture', () => {
  describe('Workflow Size Optimization', () => {
    it('should create significantly smaller save files than legacy approach', () => {
      // Mock workflow data with 6 nodes (representative of user's test case)
      const leanNodes: WorkflowNodeInstance[] = [
        {
          id: 'node-1',
          type: 'trigger',
          position: { x: 100, y: 100 },
          parameters: { triggerType: 'webhook' },
        },
        {
          id: 'node-2',
          type: 'transform',
          position: { x: 300, y: 100 },
          parameters: {
            mode: 'addFields',
            fieldsToAdd: [{ fieldName: 'processed', fieldValue: 'true' }],
          },
        },
        {
          id: 'node-3',
          type: 'condition',
          position: { x: 500, y: 100 },
          parameters: { mode: 'expression', expression: '{{$json.id > 0}}' },
        },
        {
          id: 'node-4',
          type: 'http',
          position: { x: 700, y: 50 },
          parameters: { method: 'POST', url: 'https://api.example.com/data' },
        },
        {
          id: 'node-5',
          type: 'action',
          position: { x: 700, y: 150 },
          parameters: { actionType: 'log' },
        },
        {
          id: 'node-6',
          type: 'action',
          position: { x: 900, y: 100 },
          parameters: {
            actionType: 'set',
            variableName: 'result',
            variableValue: 'success',
          },
        },
      ];

      const leanWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        active: false,
        nodes: leanNodes,
        connections: {
          'node-1': { main: [{ node: 'node-2', type: 'main', index: 0 }] },
          'node-2': { main: [{ node: 'node-3', type: 'main', index: 0 }] },
          'node-3': {
            true: [{ node: 'node-4', type: 'main', index: 0 }],
            false: [{ node: 'node-5', type: 'main', index: 0 }],
          },
          'node-4': { main: [{ node: 'node-6', type: 'main', index: 0 }] },
          'node-5': { main: [{ node: 'node-6', type: 'main', index: 0 }] },
        },
        settings: {
          saveDataErrorExecution: 'all',
          saveDataSuccessExecution: 'all',
          executionTimeout: 300,
        },
        tags: [],
      };

      // Simulate legacy bloated data with UI properties
      const legacyBloatedData = {
        ...leanWorkflow,
        nodes: leanNodes.map((node) => ({
          ...node,
          // Simulate bloated legacy data
          data: {
            ...node.parameters,
            onDelete: 'function() { /* delete handler */ }',
            onConnect: 'function() { /* connect handler */ }',
            onOpenProperties: 'function() { /* properties handler */ }',
            hasOutgoingConnection: true,
            isSelected: false,
            integrationData: {
              id: node.type,
              name: node.type,
              icon: '⚡',
              category: 'action',
              description: 'Long description here...',
              nodeTypes: [
                {
                  displayName: 'Action Node',
                  name: node.type,
                  group: ['action'],
