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
  const baseStyles = 'inline-flex items-center justify-center font-sans font-semibold tracking-[0.01em] transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-brand-accent/25 disabled:opacity-40 disabled:pointer-events-none rounded-xl';
  
  const variants = {
    primary: 'bg-brand-accent text-white hover:bg-brand-accent-hover shadow-[0_4px_12px_rgba(37,99,235,0.15)] active:scale-[0.985]',
    secondary: 'bg-brand-card text-brand-text border border-brand-border/70 hover:border-brand-accent/35 hover:bg-white/70 dark:hover:bg-slate-900/55 active:scale-[0.985] neumorphic-button',
    ghost: 'text-brand-muted hover:text-brand-text hover:bg-stone-100 dark:hover:bg-stone-900/60 active:bg-stone-200/60 dark:active:bg-stone-850/50',
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
