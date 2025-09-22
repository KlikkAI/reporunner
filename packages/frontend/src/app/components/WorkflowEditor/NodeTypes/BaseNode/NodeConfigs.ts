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
    handles: {
      input: { show: true },
      outputs: [{ id: 'output', position: { top: '50%' } }],
    },
    visual: {
      shape: 'rounded-s-3xl',
      defaultIcon: '🔄',
      selectionRingColor: 'ring-teal-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  webhook: {
    handles: {
      input: { show: true },
      outputs: [{ id: 'output', position: { top: '50%' } }],
    },
    visual: {
      shape: 'rounded-sm',
      defaultIcon: '🌐',
      selectionRingColor: 'ring-orange-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  database: {
    handles: {
      input: { show: true },
      outputs: [{ id: 'output', position: { top: '50%' } }],
    },
    visual: {
      shape: 'rounded-md',
      defaultIcon: '🗄️',
      selectionRingColor: 'ring-slate-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  email: {
    handles: {
      input: { show: true },
      outputs: [{ id: 'output', position: { top: '50%' } }],
    },
    visual: {
      shape: 'rounded-md',
      defaultIcon: '📧',
      selectionRingColor: 'ring-red-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  file: {
    handles: {
      input: { show: true },
      outputs: [{ id: 'output', position: { top: '50%' } }],
    },
    visual: {
      shape: 'rounded',
      defaultIcon: '📁',
      selectionRingColor: 'ring-emerald-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  // AI Node Types
  llm: {
    handles: {
      input: { show: true },
      outputs: [
        {
          id: 'ai_languageModel',
          position: { top: '50%' },
          color: 'bg-blue-500',
          label: 'LLM',
        },
      ],
    },
    visual: {
      shape: 'rounded-md',
      defaultIcon: '🤖',
      selectionRingColor: 'ring-blue-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  embedding: {
    handles: {
      input: { show: true },
      outputs: [
        {
          id: 'ai_embedding',
          position: { top: '50%' },
          color: 'bg-purple-500',
          label: 'Embedding',
        },
      ],
    },
    visual: {
      shape: 'rounded-md',
      defaultIcon: '🧠',
      selectionRingColor: 'ring-purple-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  vectorstore: {
    handles: {
      input: { show: true },
      outputs: [
        {
          id: 'ai_vectorStore',
          position: { top: '50%' },
          color: 'bg-green-500',
          label: 'Vector Store',
        },
      ],
    },
    visual: {
      shape: 'rounded-md',
      defaultIcon: '🗃️',
      selectionRingColor: 'ring-green-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  vectorstoretool: {
    handles: {
      input: { show: true },
      outputs: [
        {
          id: 'ai_tool',
          position: { top: '50%' },
          color: 'bg-orange-500',
          label: 'Tool',
        },
      ],
    },
    visual: {
      shape: 'rounded-md',
      defaultIcon: '🔍',
      selectionRingColor: 'ring-orange-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  gmailtool: {
    handles: {
      input: { show: true },
      outputs: [
        {
          id: 'ai_tool',
          position: { top: '50%' },
          color: 'bg-red-500',
          label: 'Tool',
        },
      ],
    },
    visual: {
      shape: 'rounded-md',
      defaultIcon: '📧',
      selectionRingColor: 'ring-red-400',
      dimensions: {
        minWidth: 'min-w-[80px]',
        maxWidth: 'max-w-[150px]',
      },
    },
  },

  // AI Agent Node (special configuration for AI agents with multiple AI handles)
  'ai-agent': {
    handles: {
      input: { show: true },
      outputs: [
        {
          id: 'output',
          position: { top: '50%' },
          color: 'bg-gray-500',
          label: '',
        },
      ],
      // Special flag to indicate this needs AI-specific handles
      hasAIHandles: true,
    },
    visual: {
      shape: 'rounded-lg',
      defaultIcon: '🤖',
      selectionRingColor: 'ring-blue-400',
      dimensions: {
        minWidth: 'min-w-[120px]',
        maxWidth: 'max-w-[180px]',
        minHeight: 'min-h-[80px]',
        // Add extra bottom margin for vertical connection lines, plus icons, and labels
        style: {
          marginBottom: '85px',
        },
      },
    },
  },

  // Gmail Enhanced Node - Unified intelligent node for all Gmail operations
  'gmail-enhanced': {
    handles: {
      input: { show: true }, // Most Gmail operations need input (except pure triggers)
      outputs: [
        {
          id: 'output',
          position: { top: '50%' },
          color: 'bg-red-500',
          label: '',
        },
      ],
    },
    visual: {
      shape: 'rounded-lg',
      defaultIcon: '📧',
      selectionRingColor: 'ring-red-400',
      dimensions: {
        minWidth: 'min-w-[100px]',
        maxWidth: 'max-w-[160px]',
      },
    },
  },
};

// Helper function to get node config by type
export const getNodeConfig = (nodeType: string): BaseNodeConfig => {
  return NodeConfigs[nodeType] || NodeConfigs.action; // Default to action config
};
