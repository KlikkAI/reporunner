import type { IUseCase } from '../interfaces/IUseCase';

export interface ErrorInput {
  message: string;
  code?: string;
  type?: 'Error' | 'ValidationError' | 'NotFoundError' | 'UnauthorizedError';
}

export class ErrorUseCase implements IUseCase<ErrorInput, never> {
  async execute(input: ErrorInput): Promise<never> {
    const ErrorClass = this.getErrorClass(input.type || 'Error');
    throw new ErrorClass(input.message);
  }

  private getErrorClass(type: string): new (message: string) => Error {
    switch (type) {
      case 'ValidationError':
        return class ValidationError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'ValidationError';
          }
        };
      case 'NotFoundError':
        return class NotFoundError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'NotFoundError';
          }
        };
      case 'UnauthorizedError':
        return class UnauthorizedError extends Error {
          constructor(message: string) {
            super(message);
            this.name = 'UnauthorizedError';
          }
        };
      default:
        return Error;
    }
  }
}
