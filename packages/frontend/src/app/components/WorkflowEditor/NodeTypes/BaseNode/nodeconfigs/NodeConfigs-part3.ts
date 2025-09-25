},
  },

  embedding:
{
  handles: {
    input: {
      show: true;
    }
    ,
      outputs: [
    {
      id: 'ai_embedding', position;
      :
      {
        top: '50%';
      }
      ,
          color: 'bg-purple-500',
          label: 'Embedding',
    }
    ,
      ],
  }
  ,
    visual:
  {
    shape: 'rounded-md', defaultIcon;
    : '🧠',
      selectionRingColor: 'ring-purple-400',
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

  vectorstore:
{
  handles: {
    input: {
      show: true;
    }
    ,
      outputs: [
    {
      id: 'ai_vectorStore', position;
      :
      {
        top: '50%';
      }
      ,
          color: 'bg-green-500',
          label: 'Vector Store',
    }
    ,
      ],
  }
  ,
    visual:
  {
    shape: 'rounded-md', defaultIcon;
    : '🗃️',
      selectionRingColor: 'ring-green-400',
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

  vectorstoretool:
{
  handles: {
    input: {
      show: true;
    }
    ,
      outputs: [
    {
      id: 'ai_tool', position;
      :
      {
        top: '50%';
      }
      ,
          color: 'bg-orange-500',
          label: 'Tool',
    }
    ,
      ],
  }
  ,
    visual:
  {
    shape: 'rounded-md', defaultIcon;
    : '🔍',
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

  gmailtool:
{
  handles: {
    input: {
      show: true;
    }
    ,
      outputs: [
    {
      id: 'ai_tool', position;
      :
      {
        top: '50%';
      }
      ,
          color: 'bg-red-500',
          label: 'Tool',
    }
    ,
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

  // AI Agent Node (special configuration for AI agents with multiple AI handles)
  'ai-agent':
{
    handles: {
      input: { show: true },
      outputs: [
