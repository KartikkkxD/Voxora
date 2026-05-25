import React, { useState } from 'react';
import { APP_NAME } from '../../constants';
import { Badge } from '../ui/Badge';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../context/AuthContext';
import { AuthModal } from '../auth/AuthModal';
import { Sun, Moon } from 'lucide-react';

/**
 * Minimal Header Component containing logo, theme toggle, authentication, and status indicators.
 */
export const Header = () => {
  const { isDark, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('[Header] Sign out failed:', err);
    }
  };

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
          <Badge variant="accent">v1.1.0-supabase</Badge>
        </div>
        
        <div className="flex items-center space-x-3.5">
          {/* Auth Button Controls */}
          {user ? (
            <div className="flex items-center space-x-2.5">
              <span className="text-[11px] font-sans font-medium text-brand-muted truncate max-w-[110px] hidden sm:inline">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-[11px] font-sans font-medium text-brand-muted hover:text-brand-text border border-brand-border hover:bg-stone-50 dark:hover:bg-stone-900/60 px-2.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="text-[11px] font-sans font-semibold text-brand-accent hover:text-white border border-brand-accent/25 hover:bg-brand-accent bg-brand-accent-light px-3.5 py-1.5 rounded-lg transition-all duration-200 cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 text-brand-muted hover:text-brand-text hover:bg-stone-100 dark:hover:bg-stone-900/60 rounded-lg transition-all duration-200 border border-transparent hover:border-brand-border/40 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={17} strokeWidth={2.2} /> : <Moon size={17} strokeWidth={2.2} />}
          </button>

          {/* GitHub Icon Link */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-brand-muted hover:text-brand-text hover:bg-stone-100 dark:hover:bg-stone-900/60 rounded-lg transition-all duration-200 border border-transparent hover:border-brand-border/40"
            aria-label="GitHub Repository"
          >
            <svg
              viewBox="0 0 24 24"
              width="17"
              height="17"
              stroke="currentColor"
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-[17px] h-[17px]"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </a>
        </div>
      </div>

      {/* Auth Modal Overlay */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </header>
  );
};

