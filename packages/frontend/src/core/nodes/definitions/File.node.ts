/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
} from "../types";

export class FileNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: "File",
    name: "file",
    icon: "📁",
    group: ["files"],
    version: 1,
    description: "Read, write, and manipulate files and directories",
    defaults: {
      name: "File",
      color: "#6366f1",
    },
    inputs: ["main"],
    outputs: ["main"],
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        default: "read",
        required: true,
        options: [
          {
            name: "Read File",
            value: "read",
            description: "Read contents of a file",
          },
          {
            name: "Write File",
            value: "write",
            description: "Write content to a file",
          },
          {
            name: "Append File",
            value: "append",
            description: "Append content to a file",
          },
          {
            name: "Delete File",
            value: "delete",
            description: "Delete a file",
          },
          {
            name: "Copy File",
            value: "copy",
            description: "Copy a file to another location",
          },
          {
            name: "Move File",
            value: "move",
            description: "Move/rename a file",
          },
          {
            name: "List Directory",
            value: "list",
            description: "List files in a directory",
          },
          {
            name: "Create Directory",
            value: "mkdir",
            description: "Create a new directory",
          },
        ],
        description: "File operation to perform",
      },
      {
        displayName: "File Path",
        name: "filePath",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            operation: ["read", "write", "append", "delete", "copy", "move"],
          },
        },
        description: "Path to the file",
        placeholder: "/path/to/your/file.txt",
      },
      {
        displayName: "Directory Path",
        name: "directoryPath",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            operation: ["list", "mkdir"],
          },
        },
        description: "Path to the directory",
        placeholder: "/path/to/directory",
      },
      {
        displayName: "Content",
        name: "content",
        type: "text",
        default: "",
        required: true,
        displayOptions: {
          show: {
            operation: ["write", "append"],
          },
        },
        description: "Content to write to the file",
        placeholder: "File content here...",
      },
      {
        displayName: "Destination Path",
        name: "destinationPath",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            operation: ["copy", "move"],
          },
        },
        description: "Destination path for copy/move operation",
        placeholder: "/path/to/destination/file.txt",
      },
      {
        displayName: "Encoding",
        name: "encoding",
        type: "options",
        default: "utf8",
        displayOptions: {
          show: {
            operation: ["read", "write", "append"],
          },
        },
        options: [
          {
            name: "UTF-8",
            value: "utf8",
          },
          {
            name: "ASCII",
            value: "ascii",
          },
          {
            name: "Base64",
            value: "base64",
          },
          {
            name: "Binary",
            value: "binary",
          },
        ],
        description: "File encoding format",
      },
      {
        displayName: "Create Directories",
        name: "createDirectories",
        type: "boolean",
        default: true,
        displayOptions: {
          show: {
            operation: ["write", "copy", "move"],
          },
        },
        description: "Create parent directories if they do not exist",
      },
      {
        displayName: "Overwrite",
        name: "overwrite",
        type: "boolean",
        default: false,
        displayOptions: {
          show: {
            operation: ["write", "copy", "move"],
          },
        },
        description: "Overwrite file if it already exists",
      },
      {
        displayName: "Include Hidden Files",
        name: "includeHidden",
        type: "boolean",
        default: false,
        displayOptions: {
          show: {
            operation: ["list"],
          },
        },
        description: "Include hidden files in directory listing",
      },
      {
        displayName: "Recursive",
        name: "recursive",
        type: "boolean",
        default: false,
        displayOptions: {
          show: {
            operation: ["list", "mkdir"],
          },
        },
        description: "Apply operation recursively to subdirectories",
      },
    ],
    categories: ["Files"],
  };

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const operation = this.getNodeParameter("operation", "read") as string;
    const results: INodeExecutionData[] = [];

    // Mock file operations - in real implementation would use Node.js fs module
    switch (operation) {
      case "read": {
        const filePath = this.getNodeParameter("filePath", "") as string;
        const encoding = this.getNodeParameter("encoding", "utf8") as string;

        results.push({
          json: {
            operation: "read",
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

      case "write":
      case "append": {
        const filePath = this.getNodeParameter("filePath", "") as string;
        const content = this.getNodeParameter("content", "") as string;
        const encoding = this.getNodeParameter("encoding", "utf8") as string;
        const createDirectories = this.getNodeParameter(
          "createDirectories",
          true,
        ) as boolean;
        const overwrite = this.getNodeParameter("overwrite", false) as boolean;

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

      case "delete": {
        const filePath = this.getNodeParameter("filePath", "") as string;

        results.push({
          json: {
            operation: "delete",
            filePath,
            success: true,
            existed: true,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }

      case "copy":
      case "move": {
        const filePath = this.getNodeParameter("filePath", "") as string;
        const destinationPath = this.getNodeParameter(
          "destinationPath",
          "",
        ) as string;
        const createDirectories = this.getNodeParameter(
          "createDirectories",
          true,
        ) as boolean;
        const overwrite = this.getNodeParameter("overwrite", false) as boolean;

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

      case "list": {
        const directoryPath = this.getNodeParameter(
          "directoryPath",
          "",
        ) as string;
        const includeHidden = this.getNodeParameter(
          "includeHidden",
          false,
        ) as boolean;
        const recursive = this.getNodeParameter("recursive", false) as boolean;

        // Mock directory listing
        const mockFiles = [
          {
            name: "document1.txt",
            type: "file",
            size: 1024,
            lastModified: new Date(),
          },
          {
            name: "document2.pdf",
            type: "file",
            size: 2048,
            lastModified: new Date(),
          },
          {
            name: "subfolder",
            type: "directory",
            size: null,
            lastModified: new Date(),
          },
        ];

        if (includeHidden) {
          mockFiles.push({
            name: ".hidden-file",
            type: "file",
            size: 512,
            lastModified: new Date(),
          });
        }

        results.push({
          json: {
            operation: "list",
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

      case "mkdir": {
        const directoryPath = this.getNodeParameter(
          "directoryPath",
          "",
        ) as string;
        const recursive = this.getNodeParameter("recursive", false) as boolean;

        results.push({
          json: {
            operation: "mkdir",
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
