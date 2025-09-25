if (typeof value === 'object' && value !== null) return 'objectValue';
return 'stringValue';
}
}

// Nested object manipulation utilities
class NestedObjectUtils {
  static setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  static getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }

    return current;
  }

  static hasNestedPath(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  static deleteNestedValue(obj: any, path: string): boolean {
    const keys = path.split('.');
    if (keys.length === 1) {
      if (path in obj) {
        delete obj[path];
        return true;
      }
      return false;
    }

    const parentPath = keys.slice(0, -1).join('.');
    const lastKey = keys[keys.length - 1];
    const parent = NestedObjectUtils.getNestedValue(obj, parentPath);

    if (parent && typeof parent === 'object' && lastKey in parent) {
      delete parent[lastKey];
      return true;
    }

    return false;
  }
}

// Input field management utilities
class InputFieldManager {
  static getFieldsFromInputData(inputData: any[]): string[] {
    const fieldNames = new Set<string>();

    inputData.forEach((item) => {
      if (item.json && typeof item.json === 'object') {
        InputFieldManager.extractFieldNames(item.json, '', fieldNames);
      }
    });

    return Array.from(fieldNames).sort();
  }

  private static extractFieldNames(obj: any, prefix: string, fieldNames: Set<string>): void {
    Object.keys(obj).forEach((key) => {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      fieldNames.add(fullPath);

      // Recursively extract nested field names (limited depth to avoid performance issues)
      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key]) &&
        prefix.split('.').length < 3
      ) {
        InputFieldManager.extractFieldNames(obj[key], fullPath, fieldNames);
      }
    });
