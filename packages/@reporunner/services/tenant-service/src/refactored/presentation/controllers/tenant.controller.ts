import type { NextFunction, Request, Response } from 'express';
import type { ChangePlanUseCase } from '../../application/use-cases/change-plan.use-case';
import type { CreateTenantUseCase } from '../../application/use-cases/create-tenant.use-case';
import type { DeleteTenantUseCase } from '../../application/use-cases/delete-tenant.use-case';
import type { GetTenantUseCase } from '../../application/use-cases/get-tenant.use-case';
import type { ListTenantsUseCase } from '../../application/use-cases/list-tenants.use-case';
import type { UpdateTenantUseCase } from '../../application/use-cases/update-tenant.use-case';
import { HttpStatus } from '../../shared/enums/http-status.enum';
import type { ApiResponse } from '../../shared/types/api-response';
import { logger } from '../../shared/utils/logger';

export class TenantController {
  constructor(
    private readonly createTenantUseCase: CreateTenantUseCase,
    private readonly updateTenantUseCase: UpdateTenantUseCase,
    private readonly getTenantUseCase: GetTenantUseCase,
    private readonly listTenantsUseCase: ListTenantsUseCase,
    private readonly deleteTenantUseCase: DeleteTenantUseCase,
    private readonly changePlanUseCase: ChangePlanUseCase
  ) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const dto = {
        ...req.body,
        ownerId: userId,
      };

      const result = await this.createTenantUseCase.execute(dto);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Tenant created successfully',
      };

      res.status(HttpStatus.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const result = await this.getTenantUseCase.execute({ id, userId });

      if (!result) {
        res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Tenant not found',
        });
        return;
      }

      const response: ApiResponse = {
        success: true,
        data: result,
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, status, search, sortBy, sortOrder } = req.query;
      const userId = req.user?.id;

      const dto = {
        page: Number(page),
        limit: Number(limit),
        status: status as string,
        search: search as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        userId,
      };

      const result = await this.listTenantsUseCase.execute(dto);

      const response: ApiResponse = {
        success: true,
        data: result.items,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const dto = {
        id,
        ...req.body,
        updatedBy: userId,
      };

      const result = await this.updateTenantUseCase.execute(dto);

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Tenant updated successfully',
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await this.deleteTenantUseCase.execute({ id, deletedBy: userId });

      const response: ApiResponse = {
        success: true,
        message: 'Tenant deleted successfully',
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async changePlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { plan } = req.body;
      const userId = req.user?.id;

      const result = await this.changePlanUseCase.execute({
        tenantId: id,
        newPlan: plan,
        changedBy: userId,
      });

      const response: ApiResponse = {
        success: true,
        data: result,
        message: 'Plan changed successfully',
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  // Health check endpoint
  async health(req: Request, res: Response): Promise<void> {
    res.status(HttpStatus.OK).json({
      success: true,
      service: 'tenant-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
    });
  }
}
