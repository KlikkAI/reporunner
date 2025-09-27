export interface IMapper<TSource, TTarget> {
  toTarget(source: TSource): TTarget;
  toSource(target: TTarget): TSource;
}
