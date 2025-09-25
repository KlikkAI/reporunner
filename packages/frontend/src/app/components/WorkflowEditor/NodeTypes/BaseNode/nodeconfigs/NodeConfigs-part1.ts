import type { BaseNodeConfig } from './index';

// Node configuration presets for different node types
export const NodeConfigs: Record<string, BaseNodeConfig> = {
  trigger: {
    handles: {
      input: { show: false },
      outputs: [{ id: 'output', position: { top: '50%' } }],
    },
    visual: {
      shape: 'rounded-s-3xl',
      defaultIcon: 'trigger-default',
      selectionRingColor: 'ring-blue-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  action: {
    handles: {
      input: { show: true },
      outputs: [{ id: 'output', position: { top: '50%' } }],
    },
    visual: {
      shape: 'rounded-t-3xl',
      defaultIcon: 'action-default',
      selectionRingColor: 'ring-blue-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  condition: {
    handles: {
      input: { show: true },
      outputs: [], // Outputs are managed dynamically by ConditionNode
      dynamicOutputs: true,
      maxOutputs: 10,
    },
    visual: {
      shape: 'rounded-s-lg rounded-ee-sm',
      defaultIcon: 'condition-default',
      selectionRingColor: 'ring-yellow-400',
      dimensions: {
        minWidth: 'min-w-[100px]',
        maxWidth: 'max-w-[200px]',
      },
    },
  },

  delay: {
    handles: {
      input: { show: true },
      outputs: [{ id: 'output', position: { top: '50%' } }],
    },
    visual: {
      shape: 'rounded-sm',
      defaultIcon: '⏰',
      selectionRingColor: 'ring-purple-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  loop: {
    handles: {
      input: { show: true },
      outputs: [
        {
          id: 'loop',
          position: { top: '30%' },
          color: 'bg-indigo-500',
          label: '🔄 Loop',
        },
        {
          id: 'exit',
          position: { top: '70%' },
          color: 'bg-gray-500',
          label: '→ Exit',
        },
      ],
    },
    visual: {
      shape: 'rounded-s-3xl',
      defaultIcon: '🔄',
      selectionRingColor: 'ring-indigo-400',
      dimensions: {
        minWidth: 'min-w-[150px]',
        maxWidth: 'max-w-[180px]',
      },
    },
  },

  transform: {
