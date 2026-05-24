import React from 'react';

/**
 * Minimal Waveform Visualizer.
 * Renders horizontal bars that scale vertically in response to audioLevels.
 * Color shifts to accent color when recording is active.
 */
export const WaveformVisualizer = ({ audioLevels, isRecording }) => {
  return (
    <div className="w-full flex items-center justify-center h-16 gap-[3px] select-none py-4 px-2 bg-stone-50/30 dark:bg-stone-900/15 rounded-xl border border-brand-border/20">
      {audioLevels.map((level, idx) => {
        const isActive = isRecording;
        
        // Dynamic styling for visualizer bars
        const barColor = isActive 
          ? 'bg-brand-accent' 
          : 'bg-stone-300/80 dark:bg-stone-700/85';
          
        return (
          <div
            key={idx}
            className={`w-[3px] sm:w-[4px] rounded-full ${barColor} transition-all duration-100 ease-out`}
            style={{
              height: `${Math.max(8, level * 100)}%`,
              opacity: isActive ? 0.95 : 0.6
            }}
          />
        );
      })}
    </div>
  );
};
