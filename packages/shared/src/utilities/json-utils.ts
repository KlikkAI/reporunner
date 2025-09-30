/**
 * Centralized JSON utility functions
 * Replaces JSON.use-case.ts and Parse.use-case.ts files across domains
 */
export class JsonUtils {
  static stringify(value: any, replacer?: any, space?: string | number): string {
    return JSON.stringify(value, replacer, space);
  }

  static parse<T = any>(text: string): T {
    return JSON.parse(text);
  }

  static tryParse<T = any>(text: string, fallback?: T): T | undefined {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  }

  static isValidJson(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }

  static prettify(value: any): string {
    return JSON.stringify(value, null, 2);
  }
}
