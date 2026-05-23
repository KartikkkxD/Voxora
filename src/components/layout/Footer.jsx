import React from 'react';

/**
 * Clean, restrained Footer Component.
 */
export const Footer = () => {
  return (
    <footer className="w-full py-8 px-6 md:px-12 mt-auto text-center select-none font-sans">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-muted">
        <div>
          <span>Voxora — Editorial Speech-to-Text Workspace</span>
        </div>
        <div className="flex space-x-6">
          <span>First Draft</span>
          <span>© 2026</span>
        </div>
      </div>
    </footer>
  );
};
