import { injectable } from 'inversify';

@injectable()
export class PermissionService {
  async checkPermission(userId: string, resource: string, action: string): Promise<boolean> {
    return true; // Placeholder implementation
  }
}