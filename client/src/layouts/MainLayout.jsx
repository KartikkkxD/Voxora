import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { motion } from 'framer-motion';

/**
 * MainLayout wrapper providing a consistent page shell, responsive margins, 
 * and sticky header/footer layouts with dynamic ambient background glows.
 */
export const MainLayout = ({ children, appState = 'idle' }) => {
  const isListening = appState === 'recording' || appState === 'paused';
  const isProcessing = appState === 'uploading' || appState === 'transcribing' || appState === 'saving';

  const currentGlowState = isListening ? 'listening' : isProcessing ? 'processing' : 'idle';

  // Low-contrast depth fields for restrained atmosphere
  const glow1Variants = {
    idle: {
      scale: 1.0,
      opacity: 0.07,
      transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
    },
    listening: {
      scale: 1.25,
      opacity: 0.1,
      transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
    },
    processing: {
      scale: 1.15,
      opacity: 0.12,
      transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const glow2Variants = {
    idle: {
      scale: 1.0,
      opacity: 0.06,
      transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
    },
    listening: {
      scale: 1.1,
      opacity: 0.08,
      transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
    },
    processing: {
      scale: 1.3,
      opacity: 0.1,
      transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const glow3Variants = {
    idle: {
      scale: 1.0,
      opacity: 0.04,
      transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
    },
    listening: {
      scale: 1.35,
      opacity: 0.07,
      transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
    },
    processing: {
      scale: 1.25,
      opacity: 0.08,
      transition: { duration: 2, ease: [0.16, 1, 0.3, 1] }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text selection:bg-brand-accent-light selection:text-brand-accent relative overflow-hidden">
      {/* Ambient depth fields */}
      <motion.div
        variants={glow1Variants}
        animate={currentGlowState}
        className="absolute top-[-20%] left-[-18%] w-[58vw] h-[58vw] rounded-full bg-black/35 dark:bg-black/55 blur-[120px] pointer-events-none select-none z-0"
      />
      <motion.div
        variants={glow2Variants}
        animate={currentGlowState}
        className="absolute bottom-[-18%] right-[-16%] w-[52vw] h-[52vw] rounded-full bg-black/25 dark:bg-black/45 blur-[120px] pointer-events-none select-none z-0"
      />
      <motion.div
        variants={glow3Variants}
        animate={currentGlowState}
        className="absolute top-[28%] right-[8%] w-[320px] h-[320px] rounded-full bg-white/12 dark:bg-white/6 blur-[110px] pointer-events-none select-none z-0"
      />
      
      {/* Subtle Noise Texture Overlay */}
      <div className="absolute inset-0 bg-noise opacity-[0.03] dark:opacity-[0.05] pointer-events-none select-none z-0" />
      <motion.div
        animate={{ opacity: [0.15, 0.28, 0.15] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 ambient-grid pointer-events-none select-none z-0"
      />
      
      <div className="relative z-10 flex flex-col min-h-screen w-full">
        <Header />
        <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 md:px-10 py-6 md:py-8 flex flex-col justify-start">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};

