import React from 'react';

/**
 * Reusable Badge Component for metadata and active indicators.
 */
export const Badge = ({ children, variant = 'neutral', className = '', ...props }) => {
  const baseStyles = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase font-sans select-none';
  
  const variants = {
    neutral: 'bg-stone-100 text-stone-600 border border-stone-200/60 dark:bg-stone-800/50 dark:text-stone-400 dark:border-stone-700/50',
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
