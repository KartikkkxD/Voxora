import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, Trash2, Check, AlertCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Real-time Speech-to-Text output interface.
 * Shows conversation lines, speaker cards, timestamps, blinking cursor, 
 * and provides action controls for Copying, Downloading, or Clearing logs.
 */
export const TranscriptPanel = ({ 
  transcriptLines, 
  isTranscribing, 
  appState, 
  wsStatus = 'disconnected', 
  errorMessage = '', 
  onClear 
}) => {
  const scrollRef = useRef(null);
  const [copied, setCopied] = useState(false);

  // Auto-scroll scrollbar down as characters appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcriptLines]);

  const handleCopy = () => {
    if (transcriptLines.length === 0) return;
    const text = transcriptLines
      .map((line) => `[${line.timestamp}] ${line.speaker}: ${line.text}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    if (transcriptLines.length === 0) return;
    const text = transcriptLines
      .map((line) => `[${line.timestamp}] ${line.speaker}: ${line.text}`)
      .join('\n\n');
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voxora-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const wsToneClass =
    wsStatus === 'connected'
      ? 'from-brand-text/75 to-brand-text/35'
      : wsStatus === 'connecting'
        ? 'from-brand-muted/70 to-brand-muted/30'
        : wsStatus === 'error'
          ? 'from-brand-muted/75 to-brand-muted/30'
          : 'from-brand-muted/45 to-brand-muted/15';

  return (
    <Card className="flex flex-col h-full items-stretch min-h-[380px] p-6 relative">
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: isTranscribing ? [0.06, 0.14, 0.06] : 0.04
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-4 right-10 w-36 h-36 rounded-full bg-white/15 dark:bg-white/6 blur-3xl pointer-events-none"
      />
      {/* Quiet Toolbar Header */}
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-3 mb-4 select-none relative z-10">
        <div className="flex items-center space-x-2.5">
          <h3 className="font-display font-semibold text-sm text-brand-text tracking-tight">Live Transcript</h3>
          <div className="flex items-center gap-2">
            <span className={`h-[2px] w-10 rounded-full bg-gradient-to-r ${wsToneClass}`} />
            <span className="text-[10px] uppercase tracking-[0.16em] text-brand-muted">
              {wsStatus}
            </span>
          </div>
        </div>
        
        {transcriptLines.length > 0 && (
          <div className="flex items-center space-x-1">
            <Tooltip content={copied ? "Copied" : "Copy text"}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopy}
                className="p-1.5 text-brand-muted hover:text-brand-text hover:bg-stone-100 dark:hover:bg-stone-900/60 rounded-md transition-colors border border-transparent hover:border-brand-border cursor-pointer"
                aria-label="Copy Transcript"
              >
                {copied ? <Check size={14} className="text-emerald-600 dark:text-emerald-500" /> : <Copy size={14} />}
              </motion.button>
            </Tooltip>
            
            <Tooltip content="Export TXT">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleExport}
                className="p-1.5 text-brand-muted hover:text-brand-text hover:bg-stone-100 dark:hover:bg-stone-900/60 rounded-md transition-colors border border-transparent hover:border-brand-border cursor-pointer"
                aria-label="Export Transcript"
              >
                <Download size={14} />
              </motion.button>
            </Tooltip>
 
            <Tooltip content="Clear workspace">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClear}
                className="p-1.5 text-brand-muted hover:text-rose-600 hover:bg-rose-100/50 dark:hover:bg-rose-950/20 rounded-md transition-colors border border-transparent hover:border-rose-300 cursor-pointer"
                aria-label="Clear Transcript"
              >
                <Trash2 size={14} />
              </motion.button>
            </Tooltip>
          </div>
        )}
      </div>
 
      {/* Output Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar max-h-[310px] min-h-[220px] relative z-10"
      >
        {appState === 'uploading' ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mb-3.5" />
            <p className="text-[13px] text-brand-text font-medium leading-relaxed font-sans">
              Uploading audio payload...
            </p>
            <p className="text-[11px] text-brand-muted mt-1 leading-relaxed font-sans">
              Sending file to server for processing.
            </p>
          </div>
        ) : appState === 'saving' ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mb-3.5" />
            <p className="text-[13px] text-brand-text font-medium leading-relaxed font-sans">
              Saving to database...
            </p>
            <p className="text-[11px] text-brand-muted mt-1 leading-relaxed font-sans">
              Persisting transcript record under your profile.
            </p>
          </div>
        ) : appState === 'transcribing' && transcriptLines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="w-5 h-5 border-2 border-brand-accent border-t-transparent rounded-full animate-spin mb-3.5" />
            <p className="text-[13px] text-brand-text font-medium leading-relaxed font-sans">
              Analyzing audio frequencies...
            </p>
            <p className="text-[11px] text-brand-muted mt-1 leading-relaxed font-sans">
              Transcribing audio via Deepgram Speech-to-Text.
            </p>
          </div>
        ) : appState === 'error' ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-full mb-3.5 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-450 dark:border-rose-900/30 animate-pulse">
              <AlertCircle size={20} />
            </div>
            <p className="text-[13px] text-brand-text font-medium leading-relaxed font-sans">
              Transcription Failed
            </p>
            <p className="text-[11px] text-brand-muted mt-1 max-w-[240px] leading-relaxed font-sans">
              {errorMessage || 'Verify your server connection and Deepgram API Key credentials.'}
            </p>
          </div>
        ) : transcriptLines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-16 px-8 select-none opacity-50">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-6 h-6 text-brand-muted/80 stroke-current mb-3.5" 
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <line x1="4" y1="9" x2="4" y2="15" />
              <line x1="9" y1="6" x2="9" y2="18" />
              <line x1="14" y1="4" x2="14" y2="20" />
              <line x1="19" y1="8" x2="19" y2="16" />
            </svg>
            <p className="text-xs text-brand-muted max-w-[220px] leading-relaxed font-sans font-light">
              No active transcription. Record your voice or upload an audio file to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {transcriptLines.map((line, idx) => {
                const isInterim = line.isFinal === false;
                const isPlaceholder = line.isListeningPlaceholder === true;

                return (
                  <motion.div
                    key={line.id || idx}
                    layout
                    initial={{ opacity: 0, y: 9, scale: 0.995, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], layout: { duration: 0.3 } }}
                    className="flex flex-col space-y-1 group p-2 rounded-xl hover:bg-white/35 dark:hover:bg-slate-900/35"
                  >
                    <div className="flex items-center justify-between select-none">
                      <span className="text-[10px] font-display font-semibold tracking-wider text-brand-muted uppercase">
                        {line.speaker}
                      </span>
                      <span className="text-[9px] font-sans text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {line.timestamp}
                      </span>
                    </div>
                    
                    <p 
                      className={`text-[15px] md:text-[16px] leading-relaxed tracking-tight transition-all duration-300 ${
                        isPlaceholder
                          ? 'text-brand-text/55 dark:text-brand-text/40 italic font-light animate-[pulse_2s_infinite]'
                          : isInterim
                          ? 'text-brand-text/75 dark:text-brand-text/60 italic font-medium'
                          : 'text-brand-text dark:text-brand-text/95 font-medium font-sans'
                      }`}
                    >
                      {line.text}
                      {line.isTyping && (
                        <span className="inline-block w-1.5 h-3.5 rounded-full bg-brand-accent ml-1.5 align-middle animate-[pulse_1.2s_infinite]" />
                      )}
                    </p>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
};
