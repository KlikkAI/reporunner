/**
 * Create a new container node
 */
static
createContainer(
    type: ContainerType,
    position: { x: number;
y: number;
},
    customConfig?: Partial<ContainerNodeData['config']>,
    customLabel?: string
  ): Node
{
  const template = CONTAINER_TEMPLATES[type];
  const nodeId = `container-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const containerData: ContainerNodeData = {
    label: customLabel || template.label,
    containerType: type,
    children: [],
    config: {
      ...template.defaultConfig,
      ...customConfig,
    },
    dimensions: { ...template.defaultDimensions },
    autoResize: true,
    padding: 20,
    isExpanded: true,
    isCollapsed: false,
  };

  return {
      id: nodeId,
      type: 'container',
      position,
      data: containerData,
      style: {
        width: template.defaultDimensions.width,
        height: template.defaultDimensions.height,
      },
    };
}

/**
 * Create a loop container with specific configuration
 */
static
createLoopContainer(
    position: { x: number;
y: number;
},
    loopConfig:
{
  mode?: 'forEach' | 'while' | 'count';
  condition?: string;
  count?: number;
  variable?: string;
}
=
{
}
): Node
{
  return ContainerFactory.createContainer('loop', position, {
      loopMode: loopConfig.mode || 'forEach',
      loopCondition: loopConfig.condition,
      loopCount: loopConfig.count || 10,
      loopVariable: loopConfig.variable || 'item',
    });
}

/**
 * Create a parallel container with specific configuration
 */
static
createParallelContainer(
    position: { x: number;
y: number;
},
    parallelConfig:
{
  mode?: 'all' | 'first' | 'race';
  maxConcurrency?: number;
}
=
{
}
): Node
{
  return ContainerFactory.createContainer('parallel', position, {
      parallelMode: parallelConfig.mode || 'all',
      maxConcurrency: parallelConfig.maxConcurrency || 5,
    });
}

/**
 * Create a conditional container with custom conditions
 */
static
createConditionalContainer(
    position: { x: number;
y: number;
},
    conditions: Array<
{
  id: string;
  condition: string;
  label: string;
}
> = [
{
  id: 'true', condition;
  : 'true', label: 'True'
}
,
{
  id: 'false', condition;
  : 'false', label: 'False'
}
,
    ]
  ): Node
{
  return ContainerFactory.createContainer('conditional', position, {
      conditions,
    });
}

/**
 * Create a subflow container
 */
static
createSubflowContainer(
    position: { x: number;
y: number;
},
    subflowConfig:
{
  subflowId?: string;
  passthrough?: boolean;
}
=
{
}
): Node
{
