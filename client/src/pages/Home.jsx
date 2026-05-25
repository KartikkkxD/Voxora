import React, { useState, useRef, useEffect } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { UploadZone } from '../components/upload/UploadZone';
import { RecordControl } from '../components/transcription/RecordControl';
import { WaveformVisualizer } from '../components/visualizer/WaveformVisualizer';
import { TranscriptPanel } from '../components/transcription/TranscriptPanel';
import { HistoryPanel } from '../components/transcription/HistoryPanel';
import { AuthModal } from '../components/auth/AuthModal';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTranscription } from '../hooks/useTranscription';
import { useAuth } from '../context/AuthContext';
import { HERO_CONTENT } from '../constants';
import { Button } from '../components/ui/Button';
import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeIn, slideUpFade } from '../animations';
import { transcribeAudioFile } from '../services/api';

/**
 * Main Home Page Workspace Connector.
 * Day 3 Edition: Interfaces with the real-world Deepgram audio transcription API.
 * Maps pipeline: record/upload -> upload to Express -> send to Deepgram -> display output.
 */
export const Home = () => {
  const [appState, setAppState] = useState('idle'); // 'idle' | 'recording' | 'paused' | 'uploading' | 'transcribing' | 'saving' | 'completed' | 'error'
  const [activeSource, setActiveSource] = useState('none'); // 'none' | 'recording' | 'upload'
  const [transcriptionData, setTranscriptionData] = useState([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  const { user } = useAuth();
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

  // Initialize transcription display hook
  const {
    transcriptLines,
    isTranscribing,
    startTranscription,
    pauseTranscription,
    resumeTranscription,
    resetTranscription
  } = useTranscription(transcriptionData);

  // Dynamic visualizer levels array synced to 24 bars
  const [displayLevels, setDisplayLevels] = useState(Array(24).fill(0.06));

  // Sync visualizer data
  useEffect(() => {
    if (appState === 'recording') {
      setDisplayLevels(audioLevels);
    } else if (appState === 'uploading' || appState === 'transcribing') {
      // Simulate reading/analyzing file visuals during uploads and transcription
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
  }, [audioLevels, appState]);

  // Handle transition to completed once transcription typing finishes
  useEffect(() => {
    if (appState === 'transcribing' && !isTranscribing && transcriptLines.length > 0) {
      console.info('[TRANSCRIPTION_COMPLETED] Transcript successfully loaded and typed out.');
      setAppState('completed');
    }
  }, [isTranscribing, appState, transcriptLines]);

  // Start transcription display once API returns and maps text lines
  useEffect(() => {
    if (appState === 'transcribing' && transcriptionData.length > 0) {
      console.info('[Home] Transcription dataset mapped. Triggering progressive typing render.');
      startTranscription();
    }
  }, [transcriptionData, appState]);

  // Sync recorder hooks error states
  useEffect(() => {
    if (recordingStatus === 'error') {
      console.error('[Home] Microphone / Recorder reported an error.');
      setAppState('error');
    }
  }, [recordingStatus]);

  // Watch for recordedBlob from the hook and upload it
  useEffect(() => {
    if (recordedBlob && activeSource === 'recording' && appState === 'uploading') {
      console.info('[Home] Live audio blob captured. Dispatched to uploader.');
      uploadAudioPayload(recordedBlob, 'live-recording.webm');
    }
  }, [recordedBlob, activeSource, appState]);

  // Upload and Transcribe payload dispatcher
  const uploadAudioPayload = async (blobOrFile, fileName) => {
    try {
      console.info(`[UPLOAD_RECEIVED] [${new Date().toISOString()}] Audio file staged for upload: ${fileName}`);
      setAppState('uploading');

      // Get duration if source is recording, else 0
      const audioDuration = activeSource === 'recording' ? duration : 0;

      // Dispatch to real Express STT upload pipeline
      const response = await transcribeAudioFile(blobOrFile, fileName, audioDuration, activeSource);
      console.info(`[Home] Transcription text returned: "${response.transcript}"`);

      // Split the transcript returned by backend by sentence to retain visual pacing
      const sentences = response.transcript.match(/[^.!?]+[.!?]+/g) || [response.transcript];
      const lines = sentences
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((sentence, idx) => ({
          id: `line-${idx}-${Date.now()}`,
          speaker: activeSource === 'recording' ? 'You' : 'Speaker 1',
          text: sentence,
          delayAfter: 0.8 + Math.random() * 0.4
        }));

      if (lines.length === 0) {
        console.warn('[Home] Deepgram returned empty transcription.');
        setAppState('completed');
        return;
      }

      // Phase 2: transition through "saving" state if user is logged in
      if (user) {
        setAppState('saving');
        await new Promise((resolve) => setTimeout(resolve, 850)); // Elegant visual delay
      }

      // Transition to transcribing state to render sentence-by-sentence
      setAppState('transcribing');
      setTranscriptionData(lines);

    } catch (err) {
      console.error('[TRANSCRIPTION_FAILED] Error during Speech-to-Text pipeline:', err);
      setAppState('error');
    }
  };

  // Smooth scroll helper
  const handleScrollToWorkspace = () => {
    workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Recording actions orchestration
  const handleRecordStart = () => {
    console.info('[RECORDER_STARTED] Initializing browser recording.');
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
    console.info('[Home] Stopping recording. Staging upload...');
    stopRecording();
    setAppState('uploading');
  };

  const handleRecordReset = () => {
    console.info('[Home] Resetting workspace...');
    handleWorkspaceClear();
  };

  // Upload actions orchestration
  const handleUploadStart = () => {
    console.info('[Home] Uploading file. Resetting workspace...');
    handleWorkspaceClear();
    setActiveSource('upload');
    setAppState('uploading');
  };

  const handleUploadComplete = (file) => {
    console.info(`[Home] UploadZone simulation complete for: ${file.name}. Uploading to API...`);
    uploadAudioPayload(file, file.name);
  };

  const handleWorkspaceClear = () => {
    resetRecording();
    resetTranscription();
    setTranscriptionData([]);
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
          {/* Left Column (35%): Upload & History */}
          <div className="lg:col-span-4 h-full flex flex-col gap-6">
            <UploadZone
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
              onReset={handleWorkspaceClear}
              isRecordingActive={appState === 'recording' || appState === 'paused'}
            />
            <HistoryPanel
              onOpenAuth={() => setIsAuthOpen(true)}
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
                isRecording={appState === 'recording' || appState === 'uploading' || appState === 'transcribing'}
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
                appState={appState}
                onClear={handleWorkspaceClear}
              />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Auth Modal Trigger Overlay */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </MainLayout>
  );
};
