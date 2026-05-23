import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { UploadZone } from '../components/upload/UploadZone';
import { RecordControl } from '../components/transcription/RecordControl';
import { WaveformVisualizer } from '../components/visualizer/WaveformVisualizer';
import { TranscriptPanel } from '../components/transcription/TranscriptPanel';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTranscription } from '../hooks/useTranscription';
import { mockRecordingTranscript, mockUploadTranscript } from '../data/mockTranscript';
import { HERO_CONTENT } from '../constants';
import { Button } from '../components/ui/Button';
import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, slideUpFade } from '../animations';

/**
 * Main Home Page Page Wrapper.
 * Connects useAudioRecorder states and useTranscription text typing feeds,
 * handling side-by-side components.
 */
export const Home = () => {
  const [activeSource, setActiveSource] = useState('none'); // 'none' | 'recording' | 'upload'
  const workspaceRef = useRef(null);

  // Initialize recording state hooks
  const {
    status: recordingStatus,
    isRecording,
    duration,
    audioLevels,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder();

  // Pick simulation dataset based on upload vs live recording
  const currentMockData = activeSource === 'upload' ? mockUploadTranscript : mockRecordingTranscript;

  // Initialize transcription typist hooks
  const {
    transcriptLines,
    isTranscribing,
    startTranscription,
    pauseTranscription,
    resumeTranscription,
    resetTranscription
  } = useTranscription(currentMockData);

  // Dynamic visualizer levels: use hook values when recording, generate fake analyzer stream during file parsing, otherwise flatline
  const [displayLevels, setDisplayLevels] = useState(Array(36).fill(0.06));

  useEffect(() => {
    if (activeSource === 'recording') {
      setDisplayLevels(audioLevels);
    } else if (activeSource === 'upload' && isTranscribing) {
      // Simulate visualizer active bars when playing back/analyzing file
      const interval = setInterval(() => {
        setDisplayLevels(
          Array.from({ length: 36 }, (_, i) => {
            const mid = 17.5;
            const dist = Math.abs(i - mid);
            const factor = Math.max(0.1, 1 - dist / 18);
            return Math.max(0.08, Math.min(0.85, (Math.sin(Date.now() / 300 + i * 0.4) * 0.2 + 0.4) * factor * (Math.random() * 0.5 + 0.5)));
          })
        );
      }, 90);
      return () => clearInterval(interval);
    } else {
      // Idle state
      setDisplayLevels(audioLevels);
    }
  }, [audioLevels, activeSource, isTranscribing]);

  // Smooth scroll down to workspace
  const handleScrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Recording events orchestration
  const handleRecordStart = () => {
    setActiveSource('recording');
    startRecording();
    startTranscription();
  };

  const handleRecordPause = () => {
    pauseRecording();
    pauseTranscription();
  };

  const handleRecordResume = () => {
    resumeRecording();
    resumeTranscription();
  };

  const handleRecordStop = () => {
    stopRecording();
    pauseTranscription();
  };

  const handleRecordReset = () => {
    resetRecording();
    resetTranscription();
    setActiveSource('none');
  };

  // Upload events orchestration
  const handleUploadStart = () => {
    handleWorkspaceClear();
    setActiveSource('upload');
  };

  const handleUploadComplete = (file) => {
    // Begin typing the uploaded conversational transcript
    startTranscription();
  };

  const handleWorkspaceClear = () => {
    resetRecording();
    resetTranscription();
    setActiveSource('none');
  };

  return (
    <MainLayout>
      {/* 1. Minimal centered hero section */}
      <section className="py-20 md:py-28 flex flex-col items-center text-center select-none">
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="max-w-3xl flex flex-col items-center"
        >
          <span className="text-[11px] font-sans font-bold tracking-widest text-brand-muted uppercase mb-4">
            Introducing Voxora
          </span>
          <h1 className="font-display font-semibold text-5xl md:text-6xl lg:text-7xl tracking-tight text-brand-text leading-[1.08] mb-6">
            {HERO_CONTENT.headline}
          </h1>
          <p className="font-sans text-brand-muted text-base md:text-lg max-w-xl leading-relaxed mb-8">
            {HERO_CONTENT.subheading}
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={handleScrollToWorkspace}
            className="group gap-2 hover:translate-y-px transition-transform duration-200"
          >
            {HERO_CONTENT.cta}
            <ArrowDown size={15} className="group-hover:translate-y-0.5 transition-transform duration-200" />
          </Button>
        </motion.div>
      </section>

      {/* 2. Transcription workspace container */}
      <section
        ref={workspaceRef}
        className="w-full pt-6 pb-20 scroll-mt-24"
      >
        <motion.div
          variants={slideUpFade}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
        >
          {/* Left Column (35% Ratio): Upload */}
          <div className="lg:col-span-4 h-full">
            <UploadZone
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
              onReset={handleWorkspaceClear}
              isRecordingActive={activeSource === 'recording'}
            />
          </div>

          {/* Right Column (65% Ratio): Visualizer, Controller, Output */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full justify-between">
            {/* Visualizer & Audio Controllers grouped together */}
            <div className="flex flex-col gap-4">
              <RecordControl
                status={recordingStatus}
                isRecording={isRecording}
                duration={duration}
                onStart={handleRecordStart}
                onPause={handleRecordPause}
                onResume={handleRecordResume}
                onStop={handleRecordStop}
                onReset={handleRecordReset}
                disabled={activeSource === 'upload'}
              />
              
              <WaveformVisualizer
                audioLevels={displayLevels}
                isRecording={isRecording || (activeSource === 'upload' && isTranscribing)}
              />
            </div>

            {/* Transcript Panel output */}
            <div className="flex-1">
              <TranscriptPanel
                transcriptLines={transcriptLines}
                isTranscribing={isTranscribing}
                onClear={handleWorkspaceClear}
              />
            </div>
          </div>
        </motion.div>
      </section>
    </MainLayout>
  );
};
