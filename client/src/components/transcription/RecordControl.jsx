import { Mic, Pause, RotateCcw } from 'lucide-react';
import { formatTime } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { motion } from 'framer-motion';

/**
 * RecordControl Component.
 * Manages the microphone click states, pulses during active capture, 
 * counts transcription seconds, and lists inline buttons.
 */
export const RecordControl = ({
  status,
  isRecording,
  duration,
  onStart,
  onPause,
  onResume,
  onStop,
  onReset,
  disabled
}) => {
  return (
    <div className={`flex items-center justify-between glass-panel border border-brand-border/45 rounded-2xl p-4 shadow-[0_16px_32px_rgba(0,0,0,0.08)] select-none transition-all duration-300 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center space-x-4">
        {/* Monospaced Pulsing Mic Button */}
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <>
              {/* Outer Slow Ripple */}
              <motion.div
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: [1, 1.45, 1], opacity: [0.4, 0.05, 0.4] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeOut' }}
                className="absolute inset-0 rounded-full bg-brand-accent/15 pointer-events-none"
              />
              {/* Inner Tight Ripple */}
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.15, 0.6] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 rounded-full bg-brand-accent/20 pointer-events-none"
              />
            </>
          )}
          
          <motion.button
            whileHover={disabled || status === 'completed' ? {} : { scale: 1.05 }}
            whileTap={disabled || status === 'completed' ? {} : { scale: 0.95 }}
            onClick={isRecording ? onPause : (status === 'paused' ? onResume : onStart)}
            disabled={disabled || status === 'completed'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 border cursor-pointer ${
              isRecording
                ? 'bg-brand-accent text-white border-brand-accent hover:bg-brand-accent-hover shadow-[0_4px_12px_rgba(37,99,235,0.2)] dark:shadow-[0_4px_16px_rgba(59,130,246,0.25)]'
                : status === 'paused'
                ? 'bg-brand-accent-light text-brand-accent border-brand-accent/25 hover:bg-brand-accent/15'
                : 'bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-900 border-brand-border text-brand-muted hover:border-brand-accent/40 hover:text-brand-text dark:hover:bg-stone-850/50 shadow-inner'
            } disabled:opacity-30 disabled:cursor-not-allowed z-10`}
            aria-label={isRecording ? "Pause stream" : "Start realtime transcription"}
          >
            {isRecording ? <Pause size={16} strokeWidth={2.5} /> : <Mic size={16} strokeWidth={2.5} />}
          </motion.button>
        </div>

        {/* Counter and Labels */}
        <div className="flex flex-col">
          <span className="text-[10px] font-sans font-bold tracking-wider text-brand-muted uppercase">
            {isRecording 
              ? 'Streaming Live' 
              : status === 'paused' 
                ? 'Stream Paused' 
                : status === 'completed' 
                  ? 'Session Complete' 
                  : 'Test Realtime Transcription'}
          </span>
          <span className="text-lg font-mono font-medium tracking-tight text-brand-text leading-none mt-1">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Controller Buttons */}
      <div className="flex items-center space-x-2">
        {status === 'idle' && (
          <Button variant="secondary" size="sm" onClick={onStart} className="text-xs">
            Start Test
          </Button>
        )}
        
        {isRecording && (
          <>
            <Button variant="secondary" size="sm" onClick={onPause} className="text-xs">
              Pause
            </Button>
            <Button variant="primary" size="sm" onClick={onStop} className="text-xs">
              Stop
            </Button>
          </>
        )}

        {status === 'paused' && (
          <>
            <Button variant="secondary" size="sm" onClick={onResume} className="text-xs">
              Resume
            </Button>
            <Button variant="primary" size="sm" onClick={onStop} className="text-xs">
              Stop
            </Button>
          </>
        )}

        {status === 'completed' && (
          <Tooltip content="Reset workspace">
            <motion.button
              whileHover={{ scale: 1.05, rotate: -25 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              onClick={onReset}
              className="p-2 text-brand-muted hover:text-brand-text hover:bg-stone-50 dark:hover:bg-stone-900/60 rounded-lg transition-colors border border-brand-border/60 cursor-pointer"
              aria-label="Reset workspace"
            >
              <RotateCcw size={14} />
            </motion.button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
