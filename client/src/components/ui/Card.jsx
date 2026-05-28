import React from 'react';

/**
 * Reusable Card Component representing a clean content container.
 */
export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`glass-panel rounded-2xl p-6 transition-all duration-300 will-change-transform ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
