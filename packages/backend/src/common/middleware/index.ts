// Middleware exports - avoiding cross-package direct imports to fix TypeScript rootDir issues
// Use the built packages instead of direct source imports

// Basic middleware interface
export type MiddlewareFunction = (req: any, res: any, next: any) => void | Promise<void>;

// Re-export existing middleware from main package exports
// Note: These should be imported as built packages, not source files
