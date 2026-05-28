import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Premium Waveform Visualizer.
 * Renders horizontal bars that scale vertically with a custom bezier ease.
 * Uses a desaturated gradient color scheme and an input-driven ambient back-glow.
 */
export const WaveformVisualizer = ({ audioLevels, isRecording }) => {
  // Calculate average audio level to drive ambient breathing glow opacity and scale
  const averageLevel = useMemo(() => {
    if (!audioLevels || audioLevels.length === 0) return 0;
    const sum = audioLevels.reduce((acc, lvl) => acc + lvl, 0);
    return sum / audioLevels.length;
  }, [audioLevels]);

  // Restrained back-glow parameters synced to live volume
  const glowOpacity = isRecording ? Math.min(0.14, 0.03 + averageLevel * 0.28) : 0.01;
  const glowScale = isRecording ? Math.min(1.08, 1.0 + averageLevel * 0.2) : 1.0;

  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative w-full overflow-hidden rounded-2xl border border-brand-border/30 bg-white/35 dark:bg-slate-900/35 transition-colors duration-300 neumorphic-inset"
    >
      {/* Ambient Breathing Back-Glow */}
      {isRecording && (
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-150 ease-out"
          style={{
            background: 'radial-gradient(circle at center, rgba(255, 255, 255, 0.14) 0%, rgba(180, 180, 170, 0.04) 52%, rgba(0, 0, 0, 0) 78%)',
            opacity: glowOpacity,
            transform: `scale(${glowScale})`,
            filter: 'blur(18px)',
          }}
        />
      )}

      {/* Waveform Bars Container */}
      <div className="relative z-10 w-full flex items-center justify-center h-16 gap-[3px] select-none py-4 px-2">
        {audioLevels.map((level, idx) => {
          const isActive = isRecording;

          // Soft desaturated gradient style for active bars, dark gray for inactive
          const barStyle = isActive
            ? 'bg-brand-text/80 dark:bg-brand-text/75'
            : 'bg-stone-300/70 dark:bg-stone-700/80';

          return (
            <div
              key={idx}
              className={`w-[3px] sm:w-[4px] rounded-full ${barStyle}`}
              style={{
                height: `${Math.max(8, level * 100)}%`,
                // Custom cubic bezier provides highly responsive, organic, flutter-free motion
                transition: 'height 0.09s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
                opacity: isActive ? 0.95 : 0.55
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
};

