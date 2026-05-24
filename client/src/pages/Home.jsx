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
import { uploadAudioFile } from '../services/api';

/**
 * Main Home Page Workspace Connector.
 * Orchestrates useAudioRecorder & useTranscription hooks using a single 
 * centralized state machine: idle -> recording -> uploading -> transcribing -> completed.
 */
export const Home = () => {
  const [appState, setAppState] = useState('idle'); 
  const [activeSource, setActiveSource] = useState('none'); // 'none' | 'recording' | 'upload'
  const workspaceRef = useRef(null);

  // Initialize recording hook with real MediaRecorder and AnalyserNode
  const {
    status: recordingStatus,
    isRecording,
    duration,
    audioLevels,
    recordedBlob,
    recordedUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder();

  // Select mock data source based on user input method
  const currentMockData = activeSource === 'upload' ? mockUploadTranscript : mockRecordingTranscript;

  // Initialize transcription hook
  const {
    transcriptLines,
    isTranscribing,
    startTranscription,
    pauseTranscription,
    resumeTranscription,
    resetTranscription
  } = useTranscription(currentMockData);

  // Dynamic visualizer levels array synced to 24 bars
  const [displayLevels, setDisplayLevels] = useState(Array(24).fill(0.06));

  // Sync visualizer data
  useEffect(() => {
    if (appState === 'recording') {
      setDisplayLevels(audioLevels);
    } else if (appState === 'transcribing' && activeSource === 'upload') {
      // Simulate reading/analyzing file visuals
      const interval = setInterval(() => {
        setDisplayLevels(
          Array.from({ length: 24 }, (_, i) => {
            const mid = 11.5;
            const dist = Math.abs(i - mid);
            const factor = Math.max(0.1, 1 - dist / 12);
            return Math.max(
              0.08,
              Math.min(
                0.85,
                (Math.sin(Date.now() / 300 + i * 0.4) * 0.2 + 0.4) * factor * (Math.random() * 0.5 + 0.5)
              )
            );
          })
        );
      }, 90);
      return () => clearInterval(interval);
    } else {
      // Default idle breathing wave
      setDisplayLevels(audioLevels);
    }
  }, [audioLevels, appState, activeSource]);

  // Handle transition to completed once transcription typing finishes
  useEffect(() => {
    if (!isTranscribing && (appState === 'transcribing' || appState === 'recording' || appState === 'uploading')) {
      if (transcriptLines.length > 0) {
        console.info('[Home] Transcript rendering finished. Mode is completed.');
        setAppState('completed');
      }
    }
  }, [isTranscribing, appState, transcriptLines]);

  // Sync recorder hooks error states
  useEffect(() => {
    if (recordingStatus === 'error') {
      console.error('[Home] Audio recorder hook reported an error.');
      setAppState('error');
    }
  }, [recordingStatus]);

  // Watch for recordedBlob from the hook and dispatch it to the backend
  useEffect(() => {
    if (recordedBlob && activeSource === 'recording' && appState === 'uploading') {
      console.info('[Home] Audio blob detected from recorder. Initiating API upload...');
      uploadAudioPayload(recordedBlob, 'live-recording.webm');
    }
  }, [recordedBlob, activeSource, appState]);

  // Shared function to dispatch audio payloads to backend
  const uploadAudioPayload = async (blobOrFile, fileName) => {
    try {
      console.info(`[Home] Uploading ${fileName} to Express backend...`);
      const response = await uploadAudioFile(blobOrFile, fileName);
      console.info('[Home] Upload response received from backend:', response);

      // Transition state to transcribing and kick off simulation typing
      setAppState('transcribing');
      startTranscription();
    } catch (err) {
      console.error('[Home] Failed to upload audio payload:', err);
      setAppState('error');
    }
  };

  // Smooth scroll helper
  const handleScrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Recording actions orchestration
  const handleRecordStart = () => {
    console.info('[Home] Starting live recording lifecycle...');
    setActiveSource('recording');
    setAppState('recording');
    startRecording();
  };

  const handleRecordPause = () => {
    console.info('[Home] Recording paused.');
    setAppState('paused');
    pauseRecording();
  };

  const handleRecordResume = () => {
    console.info('[Home] Recording resumed.');
    setAppState('recording');
    resumeRecording();
  };

  const handleRecordStop = () => {
    console.info('[Home] Stopping recording. Preparing payload...');
    stopRecording();
    setAppState('uploading'); // set to uploading to trigger the useEffect hook
  };

  const handleRecordReset = () => {
    console.info('[Home] Clearing recording states...');
    handleWorkspaceClear();
  };

  // Upload actions orchestration
  const handleUploadStart = () => {
    console.info('[Home] File upload initiated. Cleaning workspace...');
    handleWorkspaceClear();
    setActiveSource('upload');
    setAppState('uploading');
  };

  const handleUploadComplete = (file) => {
    console.info(`[Home] UploadZone simulation complete for: ${file.name}. Uploading to API...`);
    // Dispatch selected file to Express server
    uploadAudioPayload(file, file.name);
  };

  const handleWorkspaceClear = () => {
    console.info('[Home] Clearing workspace state.');
    resetRecording();
    resetTranscription();
    setActiveSource('none');
    setAppState('idle');
  };

  return (
    <MainLayout>
      {/* 1. Minimal Centered Hero */}
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

      {/* 2. Unified Workspace */}
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
          {/* Left Column (35%): Upload */}
          <div className="lg:col-span-4 h-full">
            <UploadZone
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
              onReset={handleWorkspaceClear}
              isRecordingActive={appState === 'recording' || appState === 'paused'}
            />
          </div>

          {/* Right Column (65%): Recorder, Waveform Visualizer, Audio Preview, Transcript */}
          <div className="lg:col-span-8 flex flex-col gap-6 h-full justify-between">
            <div className="flex flex-col gap-4">
              {/* Voice recorder control bar */}
              <RecordControl
                status={appState === 'paused' ? 'paused' : appState === 'completed' ? 'completed' : recordingStatus}
                isRecording={appState === 'recording'}
                duration={duration}
                onStart={handleRecordStart}
                onPause={handleRecordPause}
                onResume={handleRecordResume}
                onStop={handleRecordStop}
                onReset={handleRecordReset}
                disabled={activeSource === 'upload' || appState === 'uploading' || appState === 'transcribing'}
              />
              
              {/* Responsive Waveform visualizer */}
              <WaveformVisualizer
                audioLevels={displayLevels}
                isRecording={appState === 'recording' || (activeSource === 'upload' && appState === 'transcribing')}
              />

              {/* Recorded Audio Preview Dock */}
              {recordedUrl && appState === 'completed' && (
                <motion.div
                  variants={fadeIn}
                  initial="initial"
                  animate="animate"
                  className="bg-brand-card border border-brand-border rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_1px_3px_rgba(0,0,0,0.01)]"
                >
                  <span className="text-[10px] font-sans font-bold tracking-wider text-brand-muted uppercase">
                    Audio Preview
                  </span>
                  <audio src={recordedUrl} controls className="h-8 max-w-full w-[280px]" />
                </motion.div>
              )}
            </div>

            {/* Transcript Panel output */}
            <div className="flex-1">
              <TranscriptPanel
                transcriptLines={transcriptLines}
                isTranscribing={appState === 'transcribing'}
                onClear={handleWorkspaceClear}
              />
            </div>
          </div>
        </motion.div>
      </section>
    </MainLayout>
  );
};
