import React, { useEffect, useRef, useState } from 'react';
import { Copy, Download, Trash2, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Tooltip } from '../ui/Tooltip';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { slideUpFade } from '../../animations';

/**
 * Real-time Speech-to-Text output interface.
 * Shows conversation lines, speaker cards, timestamps, blinking cursor, 
 * and provides action controls for Copying, Downloading, or Clearing logs.
 */
export const TranscriptPanel = ({ transcriptLines, isTranscribing, onClear }) => {
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

  return (
    <Card className="flex flex-col h-full items-stretch min-h-[380px] p-6 relative">
      {/* Quiet Toolbar Header */}
      <div className="flex items-center justify-between border-b border-brand-border/60 pb-3 mb-4 select-none">
        <div className="flex items-center space-x-2.5">
          <h3 className="font-display font-medium text-sm text-brand-text">Live Transcript</h3>
          {isTranscribing && (
            <Badge variant="accent" className="animate-pulse">Active</Badge>
          )}
        </div>
        
        {transcriptLines.length > 0 && (
          <div className="flex items-center space-x-1">
            <Tooltip content={copied ? "Copied" : "Copy text"}>
              <button
                onClick={handleCopy}
                className="p-1.5 text-brand-muted hover:text-brand-text hover:bg-stone-50 rounded-md transition-all duration-200 border border-transparent hover:border-brand-border/50 cursor-pointer"
                aria-label="Copy Transcript"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              </button>
            </Tooltip>
            
            <Tooltip content="Export TXT">
              <button
                onClick={handleExport}
                className="p-1.5 text-brand-muted hover:text-brand-text hover:bg-stone-50 rounded-md transition-all duration-200 border border-transparent hover:border-brand-border/50 cursor-pointer"
                aria-label="Export Transcript"
              >
                <Download size={14} />
              </button>
            </Tooltip>

            <Tooltip content="Clear workspace">
              <button
                onClick={onClear}
                className="p-1.5 text-brand-muted hover:text-rose-600 hover:bg-rose-50/50 rounded-md transition-all duration-200 border border-transparent hover:border-rose-100/40 cursor-pointer"
                aria-label="Clear Transcript"
              >
                <Trash2 size={14} />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Output Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pr-1 space-y-5 custom-scrollbar max-h-[310px] min-h-[220px]"
      >
        {transcriptLines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none">
            <p className="text-[14px] text-brand-muted max-w-[280px] leading-relaxed font-sans font-light">
              No transcription active. Start recording or upload an audio file to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {transcriptLines.map((line, idx) => (
                <motion.div
                  key={line.id || idx}
                  {...slideUpFade}
                  className="flex flex-col space-y-1.5 group"
                >
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] font-sans font-bold tracking-wider text-brand-accent uppercase">
                      {line.speaker}
                    </span>
                    <span className="text-[9px] font-sans text-brand-muted opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      {line.timestamp}
                    </span>
                  </div>
                  
                  <p className="text-[17px] leading-relaxed text-brand-text font-normal font-sans tracking-tight">
                    {line.text}
                    {line.isTyping && (
                      <span className="inline-block w-[1.5px] h-[16px] bg-brand-accent ml-1.5 align-middle animate-[pulse_1s_infinite]" />
                    )}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </Card>
  );
};
