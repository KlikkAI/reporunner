// Enhanced Base Controller - Eliminates controller duplications
import { Request, Response, NextFunction } from 'express';
import { injectable } from 'inversify';

@injectable()
export abstract class EnhancedBaseController {
  // Common response patterns found across controllers
  protected sendSuccess(res: Response, data: any, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  protected sendError(res: Response, error: string, statusCode = 400, details?: any) {
    return res.status(statusCode).json({
      success: false,
      error,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Common validation patterns
  protected validateRequestBody(req: Request, requiredFields: string[]): string | null {
    for (const field of requiredFields) {
      if (!req.body[field]) {
        return `Missing required field: ${field}`;
      }
    }
    return null;
  }

  // Common pagination
  protected getPaginationParams(req: Request) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  }

  // Common error handling
  protected handleError(res: Response, error: any, operation = 'Operation') {
    console.error(`${operation} error:`, error);
    return this.sendError(res, `${operation} failed`, 500, error.message);
  }

  // Common async wrapper
  protected asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Common query filters
  protected buildQueryFilters(req: Request, allowedFilters: string[]) {
    const filters: any = {};
    allowedFilters.forEach(field => {
      if (req.query[field]) {
        filters[field] = req.query[field];
      }
    });
    return filters;
  }
}

// Domain-specific base controllers
@injectable()
export abstract class AuthControllerBase extends EnhancedBaseController {
  protected validateAuthRequest(req: Request): string | null {
    return this.validateRequestBody(req, ['email', 'password']);
  }

  protected sendAuthSuccess(res: Response, user: any, token: string) {
    return this.sendSuccess(res, { user, token }, 'Authentication successful');
  }
}

@injectable()
export abstract class WorkflowControllerBase extends EnhancedBaseController {
  protected validateWorkflowRequest(req: Request): string | null {
    return this.validateRequestBody(req, ['name', 'nodes']);
  }

  protected sendWorkflowSuccess(res: Response, workflow: any, operation = 'Workflow operation') {
    return this.sendSuccess(res, workflow, `${operation} completed successfully`);
  }
}

@injectable()
export abstract class CrudControllerBase extends EnhancedBaseController {
  // Common CRUD operations
  protected async handleCreate(req: Request, res: Response, service: any, requiredFields: string[]) {
    const validationError = this.validateRequestBody(req, requiredFields);
    if (validationError) {
      return this.sendError(res, validationError, 400);
    }

    try {
      const result = await service.create(req.body);
      return this.sendSuccess(res, result, 'Created successfully', 201);
    } catch (error) {
      return this.handleError(res, error, 'Create');
    }
  }

  protected async handleRead(req: Request, res: Response, service: any) {
    try {
      const { page, limit, skip } = this.getPaginationParams(req);
      const filters = this.buildQueryFilters(req, []);
      const result = await service.findMany({ ...filters, skip, limit });
      return this.sendSuccess(res, result);
    } catch (error) {
      return this.handleError(res, error, 'Read');
    }
  }

  protected async handleUpdate(req: Request, res: Response, service: any) {
    try {
      const { id } = req.params;
      const result = await service.update(id, req.body);
      if (!result) {
        return this.sendError(res, 'Resource not found', 404);
      }
      return this.sendSuccess(res, result, 'Updated successfully');
    } catch (error) {
      return this.handleError(res, error, 'Update');
    }
  }

  protected async handleDelete(req: Request, res: Response, service: any) {
    try {
      const { id } = req.params;
      const result = await service.delete(id);
      if (!result) {
        return this.sendError(res, 'Resource not found', 404);
      }
      return this.sendSuccess(res, null, 'Deleted successfully');
    } catch (error) {
      return this.handleError(res, error, 'Delete');
    }
  }
}
