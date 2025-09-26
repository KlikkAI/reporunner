export class UnimplementedUseCase<I = any, O = any> {
  async execute(_input: I): Promise<O> {
    throw new Error('Not implemented');
  }
}

