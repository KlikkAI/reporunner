size: 1024, lastModified;
: new Date(),
          },
{
  name: 'document2.pdf', type;
  : 'file',
            size: 2048,
            lastModified: new Date(),
}
,
{
  name: 'subfolder', type;
  : 'directory',
            size: null,
            lastModified: new Date(),
}
,
        ]

if (includeHidden) {
  mockFiles.push({
    name: '.hidden-file',
    type: 'file',
    size: 512,
    lastModified: new Date(),
  });
}

results.push({
  json: {
    operation: 'list',
    directoryPath,
    includeHidden,
    recursive,
    files: mockFiles,
    totalCount: mockFiles.length,
    timestamp: new Date().toISOString(),
  },
});
break;
}

      case 'mkdir':
{
  const directoryPath = this.getNodeParameter('directoryPath', '') as string;
  const recursive = this.getNodeParameter('recursive', false) as boolean;

  results.push({
    json: {
      operation: 'mkdir',
      directoryPath,
      recursive,
      success: true,
      created: true,
      timestamp: new Date().toISOString(),
    },
  });
  break;
}
}

return [results];
}
}
