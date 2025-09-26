import React from 'react';
import { PolymorphicComponentProps } from '../types/component';

/**
 * Type for a HOC function
 */
export type HOC<P> = (
  Component: React.ComponentType<P>
) => React.ComponentType<P>;

/**
 * Type for a HOC with additional props
 */
export type HOCWithProps<InjectProps, RequiredProps = {}> = <BaseProps extends RequiredProps>(
  Component: React.ComponentType<BaseProps>
) => React.ComponentType<Omit<BaseProps, keyof InjectProps> & RequiredProps>;

/**
 * Composes multiple HOCs from right to left
 */
export const composeHOCs = <P extends object>(...hocs: HOC<any>[]) => (Component: React.ComponentType<P>) =>
  hocs.reduceRight((acc, hoc) => hoc(acc), Component);

/**
 * Creates a HOC that injects props
 */
export function withProps<InjectedProps>(injectedProps: InjectedProps) {
  return <BaseProps extends {}>(
    WrappedComponent: React.ComponentType<BaseProps & InjectedProps>
  ) => {
    return React.forwardRef<any, BaseProps>((props, ref) => (
      <WrappedComponent {...injectedProps} {...props} ref={ref} />
    ));
  };
}

/**
 * Creates a HOC that adds styles
 */
export function withStyles<BaseProps extends { className?: string }>(
  styles: string | ((props: BaseProps) => string)
) {
  return (WrappedComponent: React.ComponentType<BaseProps>) => {
    return React.forwardRef<any, BaseProps>((props, ref) => {
      const className =
        typeof styles === 'function'
          ? styles(props)
          : styles;

      return (
        <WrappedComponent
          {...props}
          className={cn(className, props.className)}
          ref={ref}
        />
      );
    });
  };
}

/**
 * Creates a HOC for handling loading states
 */
export function withLoading<BaseProps extends { loading?: boolean }>(
  LoadingComponent: React.ComponentType<any> = () => <div>Loading...</div>
) {
  return (WrappedComponent: React.ComponentType<BaseProps>) => {
    return React.forwardRef<any, BaseProps>((props, ref) => {
      if (props.loading) {
        return <LoadingComponent {...props} ref={ref} />;
      }
      return <WrappedComponent {...props} ref={ref} />;
    });
  };
}

/**
 * Creates a HOC for handling error states
 */
export function withError<BaseProps extends { error?: Error | string | null }>(
  ErrorComponent: React.ComponentType<any> = ({ error }) => <div>{error?.toString()}</div>
) {
  return (WrappedComponent: React.ComponentType<BaseProps>) => {
    return React.forwardRef<any, BaseProps>((props, ref) => {
      if (props.error) {
        return <ErrorComponent error={props.error} {...props} ref={ref} />;
      }
      return <WrappedComponent {...props} ref={ref} />;
    });
  };
}

/**
 * Creates a HOC for handling async data fetching
 */
export function withAsync<Data, BaseProps extends { data?: Data }>(
  asyncFn: (props: BaseProps) => Promise<Data>,
  options: {
    LoadingComponent?: React.ComponentType;
    ErrorComponent?: React.ComponentType<{ error: Error }>;
  } = {}
) {
  return (WrappedComponent: React.ComponentType<BaseProps>) => {
    return React.forwardRef<any, Omit<BaseProps, 'data'>>((props, ref) => {
      const { isLoading, isError, error, data } = useAsync(() => asyncFn(props as BaseProps), {
        immediate: true,
      });

      if (isLoading && options.LoadingComponent) {
        return <options.LoadingComponent />;
      }

      if (isError && options.ErrorComponent) {
        return <options.ErrorComponent error={error!} />;
      }

      return <WrappedComponent {...props} data={data} ref={ref} />;
    });
  };
}

/**
 * Creates a HOC that makes a component polymorphic
 */
export function withPolymorphic<Props extends object, DefaultElement extends React.ElementType = 'div'>(
  WrappedComponent: React.ComponentType<Props>,
  defaultElement: DefaultElement = 'div' as DefaultElement
) {
  return React.forwardRef<any, PolymorphicComponentProps<DefaultElement, Props>>(
    ({ as, ...props }, ref) => {
      const Element = as || defaultElement;
      return <Element ref={ref} {...props} as={undefined} />;
    }
  );
}