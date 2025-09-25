description: 'Apply operation recursively to subdirectories',
},
    ],
    categories: ['Files'],
  }

async
execute(this: any)
: Promise<INodeExecutionData[][]>
{
    const operation = this.getNodeParameter('operation', 'read') as string;
    const results: INodeExecutionData[] = [];

    // Mock file operations - in real implementation would use Node.js fs module
    switch (operation) {
      case 'read': {
        const filePath = this.getNodeParameter('filePath', '') as string;
        const encoding = this.getNodeParameter('encoding', 'utf8') as string;

        results.push({
          json: {
            operation: 'read',
            filePath,
            encoding,
            content: `Mock file content for ${filePath}`,
            size: 1024,
            lastModified: new Date().toISOString(),
            exists: true,
          },
        });
        break;
      }

      case 'write':
      case 'append': {
        const filePath = this.getNodeParameter('filePath', '') as string;
        const content = this.getNodeParameter('content', '') as string;
        const encoding = this.getNodeParameter('encoding', 'utf8') as string;
        const createDirectories = this.getNodeParameter('createDirectories', true) as boolean;
        const overwrite = this.getNodeParameter('overwrite', false) as boolean;

        results.push({
          json: {
            operation,
            filePath,
            contentLength: content.length,
            encoding,
            createDirectories,
            overwrite,
            success: true,
            bytesWritten: content.length,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }

      case 'delete': {
        const filePath = this.getNodeParameter('filePath', '') as string;

        results.push({
          json: {
            operation: 'delete',
            filePath,
            success: true,
            existed: true,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }

      case 'copy':
      case 'move': {
        const filePath = this.getNodeParameter('filePath', '') as string;
        const destinationPath = this.getNodeParameter('destinationPath', '') as string;
        const createDirectories = this.getNodeParameter('createDirectories', true) as boolean;
        const overwrite = this.getNodeParameter('overwrite', false) as boolean;

        results.push({
          json: {
            operation,
            sourcePath: filePath,
            destinationPath,
            createDirectories,
            overwrite,
            success: true,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }

      case 'list': {
        const directoryPath = this.getNodeParameter('directoryPath', '') as string;
        const includeHidden = this.getNodeParameter('includeHidden', false) as boolean;
        const recursive = this.getNodeParameter('recursive', false) as boolean;

        // Mock directory listing
        const mockFiles = [
          {
            name: 'document1.txt',
            type: 'file',
