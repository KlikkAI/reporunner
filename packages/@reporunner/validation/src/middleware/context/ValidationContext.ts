import { Request, Response } from 'express';
import { ValidationError } from '../errors/ValidationError';

export class ValidationContext {
  public readonly req: Request;
  public readonly res: Response;
  public readonly errors: ValidationError[];
  public readonly path: string[];
  private state: Map<string, any>;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
    this.errors = [];
    this.path = [];
    this.state = new Map();
  }

  /**
   * Add validation error
   */
  public addError(error: ValidationError): void {
    this.errors.push(error);
  }

  /**
   * Enter validation scope
   */
  public enter(path: string): ValidationContext {
    this.path.push(path);
    return this;
  }

  /**
   * Exit validation scope
   */
  public exit(): ValidationContext {
    this.path.pop();
    return this;
  }

  /**
   * Get current validation path
   */
  public getPath(): string {
    return this.path.join('.');
  }

  /**
   * Set state value
   */
  public setState(key: string, value: any): void {
    this.state.set(key, value);
  }

  /**
   * Get state value
   */
  public getState<T>(key: string): T | undefined {
    return this.state.get(key);
  }

  /**
   * Delete state value
   */
  public deleteState(key: string): void {
    this.state.delete(key);
  }

  /**
   * Check if state has key
   */
  public hasState(key: string): boolean {
    return this.state.has(key);
  }

  /**
   * Clear state
   */
  public clearState(): void {
    this.state.clear();
  }

  /**
   * Get all errors
   */
  public getErrors(): ValidationError[] {
    return [...this.errors];
  }

  /**
   * Check if there are any errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Create child context
   */
  public createChild(path: string): ValidationContext {
    const child = new ValidationContext(this.req, this.res);
    child.path.push(...this.path, path);
    return child;
  }

  /**
   * Fork context for parallel validation
   */
  public fork(): ValidationContext {
    const forked = new ValidationContext(this.req, this.res);
    forked.path.push(...this.path);
    this.state.forEach((value, key) => forked.setState(key, value));
    return forked;
  }

  /**
   * Merge child context
   */
  public merge(child: ValidationContext): void {
    this.errors.push(...child.errors);
    child.state.forEach((value, key) => this.setState(key, value));
  }

  /**
   * Set value at current path
   */
  public setValue(value: any): void {
    let current: any = this.req;
    const path = this.getPath().split('.');

    for (let i = 0; i < path.length - 1; i++) {
      const segment = path[i];
      if (!(segment in current)) {
        current[segment] = {};
      }
      current = current[segment];
    }

    current[path[path.length - 1]] = value;
  }

  /**
   * Get value at path
   */
  public getValue(path?: string): any {
    const fullPath = path ? path : this.getPath();
    let current: any = this.req;

    for (const segment of fullPath.split('.')) {
      if (current === undefined || current === null) {
        return undefined;
      }
      current = current[segment];
    }

    return current;
  }

  /**
   * Delete value at path
   */
  public deleteValue(path?: string): void {
    const fullPath = path ? path : this.getPath();
    const segments = fullPath.split('.');
    let current: any = this.req;

    for (let i = 0; i < segments.length - 1; i++) {
      if (current === undefined || current === null) {
        return;
      }
      current = current[segments[i]];
    }

    if (current !== undefined && current !== null) {
      delete current[segments[segments.length - 1]];
    }
  }

  /**
   * Check if path exists
   */
  public hasValue(path?: string): boolean {
    const fullPath = path ? path : this.getPath();
    let current: any = this.req;

    for (const segment of fullPath.split('.')) {
      if (current === undefined || current === null) {
        return false;
      }
      current = current[segment];
    }

    return current !== undefined;
  }

  /**
   * Deep clone a value
   */
  public clone<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
  }

  /**
   * Create error at current path
   */
  public createError(message: string, code?: string): ValidationError {
    return new ValidationError([{
      path: this.getPath(),
      message,
      code: code || 'VALIDATION_ERROR'
    }]);
  }

  /**
   * Get request method
   */
  public getMethod(): string {
    return this.req.method;
  }

  /**
   * Get request path
   */
  public getRequestPath(): string {
    return this.req.path;
  }

  /**
   * Get request protocol
   */
  public getProtocol(): string {
    return this.req.protocol;
  }

  /**
   * Get request hostname
   */
  public getHostname(): string {
    return this.req.hostname;
  }

  /**
   * Get request IP
   */
  public getIP(): string {
    return this.req.ip;
  }

  /**
   * Get request query parameters
   */
  public getQuery(): Record<string, any> {
    return this.req.query;
  }

  /**
   * Get request body
   */
  public getBody(): Record<string, any> {
    return this.req.body;
  }

  /**
   * Get request parameters
   */
  public getParams(): Record<string, any> {
    return this.req.params;
  }

  /**
   * Get request headers
   */
  public getHeaders(): Record<string, any> {
    return this.req.headers;
  }

  /**
   * Get request cookies
   */
  public getCookies(): Record<string, any> {
    return this.req.cookies;
  }

  /**
   * Get uploaded files
   */
  public getFiles(): Record<string, any> {
    return this.req.files || {};
  }

  /**
   * Get request user (if authenticated)
   */
  public getUser(): any {
    return (this.req as any).user;
  }

  /**
   * Check if request is authenticated
   */
  public isAuthenticated(): boolean {
    return !!(this.req as any).isAuthenticated?.();
  }
}