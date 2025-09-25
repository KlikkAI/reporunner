handles: {
  input: {
    show: true;
  }
  ,
      outputs: [
  {
    id: 'output', position;
    :
    {
      top: '50%';
    }
  }
  ],
}
,
    visual:
{
  shape: 'rounded-s-3xl', defaultIcon;
  : '🔄',
      selectionRingColor: 'ring-teal-400',
      dimensions:
  {
    minWidth: 'min-w-[80px]', maxWidth;
    : 'max-w-[150px]',
  }
  ,
}
,
  },

  webhook:
{
  handles: {
    input: {
      show: true;
    }
    ,
      outputs: [
    {
      id: 'output', position;
      :
      {
        top: '50%';
      }
    }
    ],
  }
  ,
    visual:
  {
    shape: 'rounded-sm', defaultIcon;
    : '🌐',
      selectionRingColor: 'ring-orange-400',
      dimensions:
    {
      minWidth: 'min-w-[80px]', maxWidth;
      : 'max-w-[150px]',
    }
    ,
  }
  ,
}
,

  database:
{
  handles: {
    input: {
      show: true;
    }
    ,
      outputs: [
    {
      id: 'output', position;
      :
      {
        top: '50%';
      }
    }
    ],
  }
  ,
    visual:
  {
    shape: 'rounded-md', defaultIcon;
    : '🗄️',
      selectionRingColor: 'ring-slate-400',
      dimensions:
    {
      minWidth: 'min-w-[80px]', maxWidth;
      : 'max-w-[150px]',
    }
    ,
  }
  ,
}
,

  email:
{
  handles: {
    input: {
      show: true;
    }
    ,
      outputs: [
    {
      id: 'output', position;
      :
      {
        top: '50%';
      }
    }
    ],
  }
  ,
    visual:
  {
    shape: 'rounded-md', defaultIcon;
    : '📧',
      selectionRingColor: 'ring-red-400',
      dimensions:
    {
      minWidth: 'min-w-[80px]', maxWidth;
      : 'max-w-[150px]',
    }
    ,
  }
  ,
}
,

  file:
{
  handles: {
    input: {
      show: true;
    }
    ,
      outputs: [
    {
      id: 'output', position;
      :
      {
        top: '50%';
      }
    }
    ],
  }
  ,
    visual:
  {
    shape: 'rounded', defaultIcon;
    : '📁',
      selectionRingColor: 'ring-emerald-400',
      dimensions:
    {
      minWidth: 'min-w-[80px]', maxWidth;
      : 'max-w-[150px]',
    }
    ,
  }
  ,
}
,

  // AI Node Types
  llm:
{
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
