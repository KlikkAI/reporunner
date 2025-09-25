return {
      minX: Math.min(...positions.map((p) => p.x)),
      minY: Math.min(...positions.map((p) => p.y)),
      maxX: Math.max(...positions.map((p) => p.x + (p.width as number))),
      maxY: Math.max(...positions.map((p) => p.y + (p.height as number))),
    };
}

  /**
   * Get all available container templates
   */
  static getTemplates(): ContainerTemplate[]
{
  return Object.values(CONTAINER_TEMPLATES);
}

/**
 * Get template for specific container type
 */
static
getTemplate(type: ContainerType)
: ContainerTemplate
{
  return CONTAINER_TEMPLATES[type];
}

/**
 * Validate container configuration
 */
static
validateConfig(type: ContainerType, config: any)
:
{
  isValid: boolean;
  errors: string[]
}
{
  const errors: string[] = [];

  switch (type) {
    case 'loop':
      if (config.loopMode === 'count' && (!config.loopCount || config.loopCount < 1)) {
        errors.push('Loop count must be greater than 0');
      }
      if (config.loopMode === 'while' && !config.loopCondition) {
        errors.push('While loop must have a condition');
      }
      break;

    case 'parallel':
      if (config.maxConcurrency && config.maxConcurrency < 1) {
        errors.push('Max concurrency must be greater than 0');
      }
      break;

    case 'conditional':
      if (!config.conditions || config.conditions.length === 0) {
        errors.push('Conditional container must have at least one condition');
      }
      break;

    case 'subflow':
      // Subflow validation can be added here
      break;
  }

  return {
      isValid: errors.length === 0,
      errors,
    };
}
}
