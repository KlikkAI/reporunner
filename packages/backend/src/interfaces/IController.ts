import { Request, Response } from 'express';

/**
 * Base controller interface with common HTTP methods
 */
export interface IController {
  // Common CRUD operations
  index?(req: Request, res: Response): Promise<void>;
  show?(req: Request, res: Response): Promise<void>;
  create?(req: Request, res: Response): Promise<void>;
  update?(req: Request, res: Response): Promise<void>;
  destroy?(req: Request, res: Response): Promise<void>;
}

/**
 * Extended request interface with user information
 */
export interface IAuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Controller method type for better type checking
 */
export type ControllerMethod = (req: Request, res: Response) => Promise<void>;