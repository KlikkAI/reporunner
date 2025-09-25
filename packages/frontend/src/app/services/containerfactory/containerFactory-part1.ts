/**
 * Container Factory Service
 *
 * Creates and configures different types of container nodes
 * with appropriate default settings and configurations.
 */

import type { Node } from 'reactflow';
import type {
  ContainerNodeData,
  ContainerType,
} from '../components/WorkflowEditor/NodeTypes/ContainerNode/ContainerNode';

export interface ContainerTemplate {
  type: ContainerType;
  label: string;
  description: string;
  icon: string;
  defaultConfig: ContainerNodeData['config'];
  defaultDimensions: ContainerNodeData['dimensions'];
  category: string;
}

export const CONTAINER_TEMPLATES: Record<ContainerType, ContainerTemplate> = {
  loop: {
    type: 'loop',
    label: 'Loop Container',
    description: 'Execute nodes repeatedly based on conditions or iterations',
    icon: '🔄',
    defaultConfig: {
      loopMode: 'forEach',
      loopVariable: 'item',
      loopCount: 10,
    },
    defaultDimensions: {
      width: 400,
      height: 300,
      minWidth: 300,
      minHeight: 200,
    },
    category: 'Control Flow',
  },

  parallel: {
    type: 'parallel',
    label: 'Parallel Container',
    description: 'Execute multiple nodes concurrently',
    icon: '⚡',
    defaultConfig: {
      parallelMode: 'all',
      maxConcurrency: 5,
    },
    defaultDimensions: {
      width: 450,
      height: 350,
      minWidth: 350,
      minHeight: 250,
    },
    category: 'Control Flow',
  },

  conditional: {
    type: 'conditional',
    label: 'Conditional Container',
    description: 'Execute different branches based on conditions',
    icon: '🔀',
    defaultConfig: {
      conditions: [
        { id: 'true', condition: 'true', label: 'True' },
        { id: 'false', condition: 'false', label: 'False' },
      ],
    },
    defaultDimensions: {
      width: 400,
      height: 300,
      minWidth: 300,
      minHeight: 200,
    },
    category: 'Control Flow',
  },

  subflow: {
    type: 'subflow',
    label: 'Subflow Container',
    description: 'Group related nodes into a reusable subflow',
    icon: '📦',
    defaultConfig: {
      passthrough: false,
    },
    defaultDimensions: {
      width: 500,
      height: 400,
      minWidth: 300,
      minHeight: 200,
    },
    category: 'Organization',
  },
};

export class ContainerFactory {
