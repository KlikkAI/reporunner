// Data transformer reusing patterns from workflow-engine
export class DataTransformer {
  static transform(data: any, transformations: Record<string, any>): any {
    if (!(data && transformations)) {
      return data;
    }

    // Placeholder implementation - will be enhanced when needed
    return {
      ...data,
      _transformed: true,
      _timestamp: new Date(),
    };
  }

  static extractValue(data: any, path: string): any {
    if (!(data && path)) {
      return undefined;
    }

    // Simple path extraction
    const keys = path.split('.');
    let result = data;

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return undefined;
      }
    }

    return result;
  }

  static setValue(data: any, path: string, value: any): any {
    if (!(data && path)) {
      return data;
    }

    const keys = path.split('.');
    const result = { ...data };
    let current = result;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
    return result;
  }

  static merge(target: any, source: any): any {
    if (!(target && source)) {
      return target || source;
    }

    return {
      ...target,
      ...source,
    };
  }
}
