import React from 'react';
import { APP_NAME } from '../../constants';
import { Badge } from '../ui/Badge';

/**
 * Minimal Header Component containing logo and status indicators.
 */
export const Header = () => {
  return (
    <header className="w-full py-6 px-6 md:px-12 bg-transparent select-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-display font-semibold text-lg tracking-tight flex items-center gap-2.5 text-brand-text">
            {/* Minimal SVG soundwave logo icon */}
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-5 h-5 text-brand-accent stroke-current" 
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <line x1="4" y1="9" x2="4" y2="15" />
              <line x1="9" y1="6" x2="9" y2="18" />
              <line x1="14" y1="4" x2="14" y2="20" />
              <line x1="19" y1="8" x2="19" y2="16" />
            </svg>
            {APP_NAME}
          </span>
          <Badge variant="accent">v1.0.0-draft</Badge>
        </div>
        <div className="flex items-center space-x-4">
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-muted hover:text-brand-text transition-colors duration-200"
            aria-label="GitHub Repository"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[18px] h-[18px]"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </div>
      </div>
    </header>
  );
};
