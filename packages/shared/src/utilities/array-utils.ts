/**
 * Centralized array utility functions
 * Replaces multiple duplicate use-case files across domains
 */
export class ArrayUtils {
  static map<T, U>(array: T[], callback: (item: T, index: number) => U): U[] {
    return array.map(callback);
  }

  static filter<T>(array: T[], callback: (item: T, index: number) => boolean): T[] {
    return array.filter(callback);
  }

  static forEach<T>(array: T[], callback: (item: T, index: number) => void): void {
    array.forEach(callback);
  }

  static find<T>(array: T[], callback: (item: T, index: number) => boolean): T | undefined {
    return array.find(callback);
  }

  static some<T>(array: T[], callback: (item: T, index: number) => boolean): boolean {
    return array.some(callback);
  }

  static every<T>(array: T[], callback: (item: T, index: number) => boolean): boolean {
    return array.every(callback);
  }

  static push<T>(array: T[], ...items: T[]): number {
    return array.push(...items);
  }

  static slice<T>(array: T[], start?: number, end?: number): T[] {
    return array.slice(start, end);
  }

  static join<T>(array: T[], separator?: string): string {
    return array.join(separator);
  }

  static includes<T>(array: T[], searchElement: T): boolean {
    return array.includes(searchElement);
  }

  static isArray(value: any): value is any[] {
    return Array.isArray(value);
  }
}
