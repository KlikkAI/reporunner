import { injectable } from 'inversify';

@injectable()
export class PermissionService {
  async checkPermission(_userId: string, _resource: string, _action: string): Promise<boolean> {
    return true; // Placeholder implementation
  }
}
