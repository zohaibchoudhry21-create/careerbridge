import { forwardRef } from 'react';
import { cn } from '../../lib/utils';
import { BUTTON_VARIANTS } from './buttonTokens';

/**
 * @param {'primary' | 'destructive' | 'secondary' | 'gradient'} variant
 */
const Button = forwardRef(function Button(
  { variant = 'primary', className, type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.primary, className)}
      {...props}
    />
  );
});

export default Button;
