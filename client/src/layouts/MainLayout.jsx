import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';

/**
 * MainLayout wrapper providing a consistent page shell, responsive margins, 
 * and sticky header/footer layouts.
 */
export const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text selection:bg-brand-accent-light selection:text-brand-accent">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 md:px-12 py-6 flex flex-col justify-start">
        {children}
      </main>
      <Footer />
    </div>
  );
};
