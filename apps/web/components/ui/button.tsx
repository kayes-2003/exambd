import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

type Variant = 'default' | 'outline' | 'ghost';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }>(
  ({ className, variant = 'default', ...props }, ref) => (
    <button
      ref={ref}
      className={clsx(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none',
        variant === 'default' && 'bg-accent text-white hover:bg-accent-dark',
        variant === 'outline' && 'border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900',
        variant === 'ghost' && 'hover:bg-slate-100 dark:hover:bg-slate-900',
        className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
