import { forwardRef } from 'react';
import { PolymorphicComponentProps, BaseComponentProps } from '../../types/component';
import { getBaseClasses } from '../../utils/styles';

/**
 * Button props
 */
export interface ButtonProps extends BaseComponentProps {
  /**
   * Whether the button is full width
   */
  fullWidth?: boolean;

  /**
   * Whether to show loading spinner
   */
  showSpinner?: boolean;

  /**
   * Start icon
   */
  startIcon?: React.ReactNode;

  /**
   * End icon
   */
  endIcon?: React.ReactNode;
}

/**
 * Generic button component with variants and states
 */
export const Button = forwardRef<
  HTMLButtonElement,
  PolymorphicComponentProps<'button', ButtonProps>
>(({
  as: Component = 'button',
  className,
  size,
  color,
  variant,
  disabled,
  loading,
  error,
  fullWidth,
  showSpinner = true,
  startIcon,
  endIcon,
  children,
  ...props
}, ref) => {
  const classes = getBaseClasses({
    size,
    color,
    variant,
    disabled,
    loading,
    error,
  });
  
  return (
    <Component
      ref={ref}
      className={cn(
        classes,
        'inline-flex items-center justify-center gap-2',
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {startIcon && <span className="shrink-0">{startIcon}</span>}
      
      {children}
      
      {loading && showSpinner && (
        <span className="shrink-0 animate-spin">
          {/* Add your spinner icon here */}
          ⟳
        </span>
      )}
      
      {endIcon && !loading && <span className="shrink-0">{endIcon}</span>}
    </Component>
  );
});