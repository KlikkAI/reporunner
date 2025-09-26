// Keep local placeholder as canonical for frontend; other frontend copies can re-export this if needed
import { injectable } from 'inversify';

@injectable()
export class SplitUseCase {
  async execute(_input: any): Promise<any> {
    throw new Error('Not implemented');
  }
}
