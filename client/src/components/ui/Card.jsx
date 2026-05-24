import React from 'react';

/**
 * Reusable Card Component representing a clean content container.
 */
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-brand-card border border-brand-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 transition-all duration-200 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
