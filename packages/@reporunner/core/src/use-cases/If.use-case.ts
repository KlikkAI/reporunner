import type { IUseCase } from '../interfaces/IUseCase';

export interface IfInput {
  condition: boolean | (() => boolean);
  trueValue: any;
  falseValue?: any;
}

export class IfUseCase implements IUseCase<IfInput, any> {
  async execute(input: IfInput): Promise<any> {
    const condition = typeof input.condition === 'function' 
      ? input.condition() 
      : input.condition;
    
    return condition ? input.trueValue : input.falseValue;
  }
}
