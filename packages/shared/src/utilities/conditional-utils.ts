/**
 * Centralized conditional logic utilities
 * Replaces If.use-case.ts files across domains
 */
export class ConditionalUtils {
  static if<T>(condition: boolean, thenValue: T, elseValue?: T): T | undefined {
    return condition ? thenValue : elseValue;
  }

  static switch<T>(value: any, cases: Record<string, T>, defaultValue?: T): T | undefined {
    return cases[String(value)] ?? defaultValue;
  }

  static when<T>(condition: boolean, callback: () => T): T | undefined {
    return condition ? callback() : undefined;
  }

  static unless<T>(condition: boolean, callback: () => T): T | undefined {
    return !condition ? callback() : undefined;
  }
}