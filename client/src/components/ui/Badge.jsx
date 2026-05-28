import React from 'react';

/**
 * Reusable Badge Component for metadata and active indicators.
 */
export const Badge = ({ children, variant = 'neutral', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.12em] uppercase font-sans select-none';
  
  const variants = {
    neutral: 'bg-white/70 text-brand-muted border border-brand-border/70 dark:bg-slate-900/60 dark:text-slate-300 dark:border-slate-700/70',
    accent: 'bg-brand-accent-light text-brand-accent border border-brand-accent/10',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/40',
    danger: 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/25 dark:text-rose-400 dark:border-rose-900/40',
  };

  return (
    <span
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
