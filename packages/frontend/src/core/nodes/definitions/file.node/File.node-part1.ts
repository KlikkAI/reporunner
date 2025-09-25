/* eslint-disable @typescript-eslint/no-explicit-any */
import type { INodeExecutionData, INodeType, INodeTypeDescription } from '../types';

export class FileNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'File',
    name: 'file',
    icon: '📁',
    group: ['files'],
    version: 1,
    description: 'Read, write, and manipulate files and directories',
    defaults: {
      name: 'File',
      color: '#6366f1',
    },
    inputs: ['main'],
    outputs: ['main'],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        default: 'read',
        required: true,
        options: [
          {
            name: 'Read File',
            value: 'read',
            description: 'Read contents of a file',
          },
          {
            name: 'Write File',
            value: 'write',
            description: 'Write content to a file',
          },
          {
            name: 'Append File',
            value: 'append',
            description: 'Append content to a file',
          },
          {
            name: 'Delete File',
            value: 'delete',
            description: 'Delete a file',
          },
          {
            name: 'Copy File',
            value: 'copy',
            description: 'Copy a file to another location',
          },
          {
            name: 'Move File',
            value: 'move',
            description: 'Move/rename a file',
          },
          {
            name: 'List Directory',
            value: 'list',
            description: 'List files in a directory',
          },
          {
            name: 'Create Directory',
            value: 'mkdir',
            description: 'Create a new directory',
          },
        ],
        description: 'File operation to perform',
      },
      {
        displayName: 'File Path',
        name: 'filePath',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['read', 'write', 'append', 'delete', 'copy', 'move'],
          },
        },
        description: 'Path to the file',
        placeholder: '/path/to/your/file.txt',
      },
      {
        displayName: 'Directory Path',
        name: 'directoryPath',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: {
            operation: ['list', 'mkdir'],
          },
        },
        description: 'Path to the directory',
        placeholder: '/path/to/directory',
      },
      {
        displayName: 'Content',
        name: 'content',
        type: 'text',
