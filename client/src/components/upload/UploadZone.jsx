import React, { useState, useRef } from 'react';
import { Upload, FileAudio, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFileSize } from '../../utils/formatters';
import { MAX_FILE_SIZE_BYTES, SUPPORTED_EXTENSIONS } from '../../constants';

/**
 * UploadZone Component handling drag-and-drop audio files and 
 * simulating visual upload progress.
 */
export const UploadZone = ({ onUploadStart, onUploadComplete, onReset, isRecordingActive }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [fileName, setFileName] = useState('');
  const [fileSizeStr, setFileSizeStr] = useState('');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    if (isRecordingActive) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (!file) return false;
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    
    if (!SUPPORTED_EXTENSIONS.includes(extension)) {
      setErrorMessage('Unsupported format. Use MP3, WAV, M4A, or WEBM.');
      setUploadStatus('error');
      return false;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds the 15MB limit.');
      setUploadStatus('error');
      return false;
    }

    return true;
  };

  const processFile = (file) => {
    if (!validateFile(file)) return;

    setFileName(file.name);
    setFileSizeStr(formatFileSize(file.size));
    setUploadStatus('uploading');
    setProgress(0);
    setErrorMessage('');
    onUploadStart?.();

    // Simulate progress uploading
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 18 + 7;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        setUploadStatus('success');
        setProgress(100);
        
        // Stagger complete callback slightly for visual pacing
        setTimeout(() => {
          onUploadComplete?.(file);
        }, 500);
      } else {
        setProgress(Math.round(currentProgress));
      }
    }, 120);
  };

  const handleDrop = (e) => {
    if (isRecordingActive) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (isRecordingActive || uploadStatus === 'uploading') return;
    fileInputRef.current.click();
  };

  const resetZone = () => {
    setUploadStatus('idle');
    setFileName('');
    setFileSizeStr('');
    setProgress(0);
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    onReset?.();
  };

  return (
    <Card className="flex flex-col h-full items-stretch justify-between min-h-[380px] p-6 relative select-none overflow-hidden">
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: isDragActive ? 0.42 : 0.22,
          scale: isDragActive ? 1.08 : 1
        }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-brand-accent/20 blur-3xl pointer-events-none"
      />
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {uploadStatus === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.25 }}
              whileHover={isRecordingActive ? {} : { scale: 1.01, translateY: -2 }}
              whileTap={isRecordingActive ? {} : { scale: 0.99 }}
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`relative overflow-hidden border border-dashed rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-300 ${
                isRecordingActive 
                  ? 'opacity-40 cursor-not-allowed border-brand-border bg-white/10'
                  : isDragActive
                    ? 'border-brand-accent/70 bg-brand-accent-light/25 shadow-[0_18px_32px_rgba(39,87,235,0.16)] scale-[0.99]'
                    : 'border-brand-border/80 hover:border-brand-accent/35 hover:bg-white/45 dark:hover:bg-slate-900/36'
              }`}
            >
              {/* Drag active inner gradient glow */}
              {isDragActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.08) 0%, rgba(0, 0, 0, 0) 70%)'
                  }}
                />
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".mp3,.wav,.m4a,.webm"
                onChange={handleFileChange}
                disabled={isRecordingActive}
              />
              
              <div className="relative z-10 flex flex-col items-center">
                {/* Magnetic-feel springy upload icon */}
                <motion.div 
                  whileHover={isRecordingActive ? {} : { 
                    y: -4, 
                    scale: 1.08,
                    rotate: [0, -8, 8, -5, 5, 0],
                    transition: { type: 'spring', stiffness: 220, damping: 12 }
                  }}
                className="p-3.5 bg-brand-bg/65 dark:bg-slate-900/50 rounded-full border border-brand-border/60 text-brand-muted mb-4 transition-colors duration-200 neumorphic-button"
                >
                  <Upload size={18} strokeWidth={2.2} />
                </motion.div>
                <h3 className="font-display font-medium text-sm text-brand-text mb-1">
                  Drag & drop audio here
                </h3>
                <p className="text-xs text-brand-muted max-w-[200px] mb-5 font-sans font-light">
                  or click to browse from files
                </p>
                <div className="flex items-center space-x-1.5 select-none">
                  <Badge variant="neutral">MP3</Badge>
                  <Badge variant="neutral">WAV</Badge>
                  <Badge variant="neutral">M4A</Badge>
                  <Badge variant="neutral">WEBM</Badge>
                </div>
              </div>
            </motion.div>
          )}

          {uploadStatus === 'uploading' && (
            <motion.div 
              key="uploading"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="p-4 flex flex-col items-center text-center"
            >
              <div className="p-4 bg-brand-accent-light text-brand-accent rounded-full mb-5 animate-pulse border border-brand-accent/5">
                <FileAudio size={24} />
              </div>
              <h3 className="font-display font-medium text-sm text-brand-text mb-1">
                Uploading audio...
              </h3>
              <p className="text-xs text-brand-muted truncate max-w-[200px] mb-6 font-sans">
                {fileName}
              </p>
              
              <div className="w-full max-w-[200px] bg-stone-100 dark:bg-stone-850 rounded-full h-1 overflow-hidden relative">
                <div
                  className="bg-brand-accent h-full transition-all duration-150 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-[10px] font-sans font-medium text-brand-muted mt-2">
                {progress}%
              </span>
            </motion.div>
          )}

          {uploadStatus === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="p-4 flex flex-col items-center text-center"
            >
              <div className="p-4 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full mb-5 border border-emerald-100 dark:border-emerald-900/30">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-display font-medium text-sm text-brand-text mb-1">
                File uploaded successfully
              </h3>
              <p className="text-xs text-brand-muted truncate max-w-[200px] mb-4 font-sans">
                {fileName}
              </p>
              <Badge variant="success">Ready</Badge>
            </motion.div>
          )}

          {uploadStatus === 'error' && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="p-4 flex flex-col items-center text-center"
            >
              <div className="p-4 bg-rose-50 text-rose-600 dark:bg-rose-950/25 dark:text-rose-400 rounded-full mb-5 border border-rose-100 dark:border-rose-900/40">
                <AlertCircle size={24} />
              </div>
              <h3 className="font-display font-medium text-sm text-brand-text mb-1">
                Upload Failed
              </h3>
              <p className="text-xs text-rose-600/90 max-w-[200px] mb-6 font-sans">
                {errorMessage}
              </p>
              <Button variant="secondary" size="sm" onClick={resetZone}>
                Try Again
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {uploadStatus !== 'idle' && uploadStatus !== 'uploading' && (
        <div className="border-t border-brand-border/60 pt-4 flex justify-center z-10">
          <button
            onClick={resetZone}
            className="text-[11px] font-sans font-medium text-brand-muted hover:text-brand-text transition-colors duration-200 cursor-pointer"
          >
            Clear and upload another file
          </button>
        </div>
      )}
    </Card>
  );
};
