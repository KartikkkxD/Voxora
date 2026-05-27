import { Mic, Pause, RotateCcw } from 'lucide-react';
import { formatTime } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Tooltip } from '../ui/Tooltip';
import { motion } from 'framer-motion';
import { micPulse } from '../../animations';

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
    <div className={`flex items-center justify-between bg-brand-card border border-brand-border rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.01)] select-none transition-opacity duration-300 ${disabled ? 'opacity-40 pointer-events-none' : ''}`}>
      <div className="flex items-center space-x-4">
        {/* Monospaced Pulsing Mic Button */}
        <div className="relative flex items-center justify-center">
          {isRecording && (
            <motion.div
              variants={micPulse}
              animate="animate"
              className="absolute inset-0 rounded-full bg-brand-accent/20"
            />
          )}
          <button
            onClick={isRecording ? onPause : (status === 'paused' ? onResume : onStart)}
            disabled={disabled || status === 'completed'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 border cursor-pointer ${
              isRecording
                ? 'bg-brand-accent text-white border-brand-accent hover:bg-brand-accent-hover'
                : status === 'paused'
                ? 'bg-brand-accent-light text-brand-accent border-brand-accent/25 hover:bg-brand-accent/15'
                : 'bg-stone-50 dark:bg-stone-900/40 text-brand-muted border-brand-border hover:border-brand-accent/30 hover:text-brand-text dark:hover:bg-stone-850/50'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            aria-label={isRecording ? "Pause stream" : "Start realtime transcription"}
          >
            {isRecording ? <Pause size={16} strokeWidth={2.5} /> : <Mic size={16} strokeWidth={2.5} />}
          </button>
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
            <button
              onClick={onReset}
              className="p-2 text-brand-muted hover:text-brand-text hover:bg-stone-50 dark:hover:bg-stone-900/60 rounded-lg transition-all duration-200 border border-brand-border/60 cursor-pointer"
              aria-label="Reset workspace"
            >
              <RotateCcw size={14} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
