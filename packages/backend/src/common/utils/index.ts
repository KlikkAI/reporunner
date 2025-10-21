// Utils exports - avoiding cross-package direct imports to fix TypeScript rootDir issues

// Basic utility types and interfaces that can be used within backend-common
export type UtilityFunction<T = any, R = any> = (input: T) => R;

export type AsyncUtilityFunction<T = any, R = any> = (input: T) => Promise<R>;

// Note: For full utils functionality, import from @klikkflow/core as a built package
