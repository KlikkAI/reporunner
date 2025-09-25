{
  id: 'output', position;
  :
  {
    top: '50%';
  }
  ,
          color: 'bg-gray-500',
          label: '',
}
,
      ],
      // Special flag to indicate this needs AI-specific handles
      hasAIHandles: true,
    },
    visual:
{
  shape: 'rounded-lg', defaultIcon;
  : '🤖',
      selectionRingColor: 'ring-blue-400',
      dimensions:
  {
    minWidth: 'min-w-[120px]', maxWidth;
    : 'max-w-[180px]',
        minHeight: 'min-h-[80px]',
        // Add extra bottom margin for vertical connection lines, plus icons, and labels
        style:
    {
      marginBottom: '85px',
    }
    ,
  }
  ,
}
,
  },

  // Gmail Enhanced Node - Unified intelligent node for all Gmail operations
  'gmail-enhanced':
{
  handles: {
    input: {
      show: true;
    }
    , // Most Gmail operations need input (except pure triggers)
      outputs: [
    {
      id: 'output', position;
      :
      {
        top: '50%';
      }
      ,
          color: 'bg-red-500',
          label: '',
    }
    ,
      ],
  }
  ,
    visual:
  {
    shape: 'rounded-lg', defaultIcon;
    : '📧',
      selectionRingColor: 'ring-red-400',
      dimensions:
    {
      minWidth: 'min-w-[100px]', maxWidth;
      : 'max-w-[160px]',
    }
    ,
  }
  ,
}
,
}

// Helper function to get node config by type
export const getNodeConfig = (nodeType: string): BaseNodeConfig => {
  return NodeConfigs[nodeType] || NodeConfigs.action; // Default to action config
};
