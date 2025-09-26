/**
 * Centralized string utility functions
 * Replaces 8+ duplicate use-case files across domains
 */
export class StringUtils {
  static toString(value: any): string {
    return String(value);
  }

  static trim(input: string): string {
    return input.trim();
  }

  static slice(input: string, start: number, end?: number): string {
    return input.slice(start, end);
  }

  static split(input: string, separator: string): string[] {
    return input.split(separator);
  }

  static replace(input: string, search: string, replacement: string): string {
    return input.replace(search, replacement);
  }

  static substring(input: string, start: number, end?: number): string {
    return input.substring(start, end);
  }

  static toLowerCase(input: string): string {
    return input.toLowerCase();
  }

  static toUpperCase(input: string): string {
    return input.toUpperCase();
  }

  static startsWith(input: string, searchString: string): boolean {
    return input.startsWith(searchString);
  }

  static endsWith(input: string, searchString: string): boolean {
    return input.endsWith(searchString);
  }

  static includes(input: string, searchString: string): boolean {
    return input.includes(searchString);
  }

  static indexOf(input: string, searchString: string): number {
    return input.indexOf(searchString);
  }

  static lastIndexOf(input: string, searchString: string): number {
    return input.lastIndexOf(searchString);
  }
}