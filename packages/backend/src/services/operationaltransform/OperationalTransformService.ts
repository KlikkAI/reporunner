import { injectable } from 'inversify';

@injectable()
export class OperationalTransformService {
  async transform(operation: any): Promise<any> {
    return operation;
  }
}