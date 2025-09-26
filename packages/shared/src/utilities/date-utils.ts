/**
 * Centralized date utility functions
 * Replaces Date.use-case.ts and ToISOString.use-case.ts files across domains
 */
export class DateUtils {
  static now(): Date {
    return new Date();
  }

  static toISOString(date: Date = new Date()): string {
    return date.toISOString();
  }

  static fromISOString(isoString: string): Date {
    return new Date(isoString);
  }

  static format(date: Date, format: 'iso' | 'date' | 'time' | 'datetime' = 'iso'): string {
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'date':
        return date.toLocaleDateString();
      case 'time':
        return date.toLocaleTimeString();
      case 'datetime':
        return date.toLocaleString();
      default:
        return date.toISOString();
    }
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static addHours(date: Date, hours: number): Date {
    const result = new Date(date);
    result.setHours(result.getHours() + hours);
    return result;
  }

  static isValid(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }
}