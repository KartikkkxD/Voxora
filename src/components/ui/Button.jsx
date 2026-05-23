import React from 'react';

/**
 * Reusable Button Component following Apple/Notion styling rules.
 */
export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-sans font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-accent/25 disabled:opacity-40 disabled:pointer-events-none rounded-lg';
  
  const variants = {
    primary: 'bg-brand-accent text-white hover:bg-brand-accent-hover shadow-sm active:scale-[0.98]',
    secondary: 'bg-brand-card text-brand-text border border-brand-border hover:bg-stone-50 hover:border-stone-300 shadow-2xs active:scale-[0.98]',
    ghost: 'text-brand-muted hover:text-brand-text hover:bg-stone-100 active:bg-stone-200/60',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs font-medium',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
