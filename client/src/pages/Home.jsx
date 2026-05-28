import { useState, useRef, useEffect, useMemo } from 'react';
import { MainLayout } from '../layouts/MainLayout';
import { UploadZone } from '../components/upload/UploadZone';
import { RecordControl } from '../components/transcription/RecordControl';
import { WaveformVisualizer } from '../components/visualizer/WaveformVisualizer';
import { TranscriptPanel } from '../components/transcription/TranscriptPanel';
import { HistoryPanel } from '../components/transcription/HistoryPanel';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useTranscription } from '../hooks/useTranscription';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { fadeIn, slideUpFade, staggerContainer } from '../animations';
import { transcribeAudioFile } from '../services/api';
import { formatTimestamp } from '../utils/formatters';

const REALTIME_AUDIO_QUEUE_LIMIT = 80;

/**
 * Main Home Page Workspace Connector.
 * Day 3 Edition: Interfaces with the real-world Deepgram audio transcription API.
 * Maps pipeline: record/upload -> upload to Express -> send to Deepgram -> display output.
 */
export const Home = () => {
  const [appState, setAppState] = useState('idle'); // 'idle' | 'recording' | 'paused' | 'uploading' | 'transcribing' | 'saving' | 'completed' | 'error'
  const [activeSource, setActiveSource] = useState('none'); // 'none' | 'recording' | 'upload'
  const [transcriptionData, setTranscriptionData] = useState([]);
  const [wsStatus, setWsStatus] = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected' | 'error'
  const [stableSegments, setStableSegments] = useState([]);
  const [interimText, setInterimText] = useState('');
  const [realtimeError, setRealtimeError] = useState('');
  const [realtimeStartedAtLabel, setRealtimeStartedAtLabel] = useState('');
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const { user } = useAuth();
  const workspaceRef = useRef(null);

  // Refs for tracking websocket connection and recording session metadata
  const wsRef = useRef(null);
  const sessionIdRef = useRef(null);
  const recordingStartTimeRef = useRef(null);
  const appStateRef = useRef(appState);
  const wsStatusRef = useRef(wsStatus);
  const recordingStatusRef = useRef('idle');
  const pendingAudioChunksRef = useRef([]);
  const streamSequenceRef = useRef(0);
  const finalSegmentKeysRef = useRef(new Set());
  const isStartingRealtimeRef = useRef(false);
  const isStoppingRealtimeRef = useRef(false);
  const expectedSocketClosesRef = useRef(new WeakSet());
  const closeSocketTimerRef = useRef(null);

  // Sync appState to ref to avoid stale closures in event listeners
  useEffect(() => {
    appStateRef.current = appState;
  }, [appState]);

  useEffect(() => {
    wsStatusRef.current = wsStatus;
  }, [wsStatus]);

  // Handle WebSocket unmount cleanup
  useEffect(() => {
    const expectedSocketCloses = expectedSocketClosesRef.current;

    return () => {
      if (closeSocketTimerRef.current) {
        clearTimeout(closeSocketTimerRef.current);
      }

      if (wsRef.current) {
        try {
          expectedSocketCloses.add(wsRef.current);
          if (wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'CloseStream' }));
          }
          wsRef.current.close(1000, 'component-unmount');
          console.info('[Home] Cleanup unmount: realtime WebSocket closed.');
        } catch (err) {
          console.warn('[Home] Cleanup unmount: error closing realtime WebSocket.', err);
        }
      }
    };
  }, []);

  // Reconcile stable and interim transcripts for real-time UI display.
  const realtimeLines = useMemo(() => {
    const hasRealtimeText = stableSegments.length > 0 || interimText.trim().length > 0;
    const shouldShowRealtime =
      activeSource === 'recording' &&
      (hasRealtimeText || ['recording', 'paused', 'completed'].includes(appState));

    if (!shouldShowRealtime) {
      return [];
    }

    const lines = stableSegments.map((segment, idx) => ({
      id: segment.id || `stable-segment-${idx}`,
      speaker: 'You',
      text: segment.text,
      timestamp: segment.timestamp,
      isFinal: true
    }));

    if (interimText.trim().length > 0) {
      lines.push({
        id: 'realtime-live-line',
        speaker: 'You',
        text: interimText,
        timestamp: realtimeStartedAtLabel || formatTimestamp(new Date()),
        isFinal: false,
        isTyping: true
      });
    } else if (lines.length === 0 && appState !== 'completed') {
      lines.push({
        id: 'realtime-listening-placeholder',
        speaker: 'You',
        text: 'Listening...',
        timestamp: realtimeStartedAtLabel || formatTimestamp(new Date()),
        isFinal: false,
        isListeningPlaceholder: true,
        isTyping: true
      });
    }

    return lines;
  }, [stableSegments, interimText, appState, activeSource, realtimeStartedAtLabel]);

  function flushPendingAudioChunks(reason) {
    const ws = wsRef.current;
    const queued = pendingAudioChunksRef.current;

    if (!queued.length) return;

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.info(
        `[Home] Realtime audio queue retained; websocket not open. reason=${reason}, queuedPackets=${queued.length}, wsState=${ws ? ws.readyState : 'null'}`
      );
      return;
    }

    console.info(`[Home] Flushing ${queued.length} queued audio packet(s). reason=${reason}`);
    while (queued.length > 0) {
      const packet = queued.shift();
      ws.send(packet.buffer);
      console.log(
        `[Home] Sent queued realtime packet. session=${packet.sessionId}, sequence=${packet.sequence}, bytes=${packet.byteLength}`
      );
    }
  }

  function sendRealtimeControl(type, reason) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn(
        `[Home] Cannot send realtime control ${type}; websocket state=${ws ? ws.readyState : 'null'}, reason=${reason}`
      );
      return false;
    }

    ws.send(JSON.stringify({ type }));
    console.info(`[Home] Sent realtime control ${type}. reason=${reason}`);
    return true;
  }

  function closeRealtimeSocket(reason, { sendCloseStream = false } = {}) {
    if (wsRef.current) {
      try {
        const ws = wsRef.current;
        console.info(
          `[Home] Closing realtime websocket. reason=${reason}, state=${ws.readyState}, sendCloseStream=${sendCloseStream}`
        );

        if (closeSocketTimerRef.current) {
          clearTimeout(closeSocketTimerRef.current);
          closeSocketTimerRef.current = null;
        }

        expectedSocketClosesRef.current.add(ws);

        if (sendCloseStream && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'CloseStream' }));
          console.info(`[Home] Sent CloseStream before client websocket close. reason=${reason}`);
        }

        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close(1000, reason);
        }
      } catch (err) {
        console.warn(`[Home] Error closing realtime websocket. reason=${reason}`, err);
      }
      wsRef.current = null;
    }

    pendingAudioChunksRef.current = [];
    setWsStatus('disconnected');
  }

  function appendFinalTranscript(data, transcript) {
    const start = data.start ?? data.channel?.alternatives?.[0]?.words?.[0]?.start ?? 'unknown-start';
    const duration = data.duration ?? 'unknown-duration';
    const key = `${start}:${duration}:${transcript}`;

    if (finalSegmentKeysRef.current.has(key)) {
      console.info(`[Home] Ignored duplicate final transcript segment. key=${key}`);
      return;
    }

    finalSegmentKeysRef.current.add(key);
    setStableSegments((prev) => [
      ...prev,
      {
        id: `stable-segment-${prev.length}-${Date.now()}`,
        text: transcript,
        timestamp: formatTimestamp(new Date()),
        isFinal: true
      }
    ]);
  }

  function handleRealtimePayload(payload) {
    console.log('[Home] Realtime websocket payload received:', payload);

    if (activeSource !== 'recording') {
      setActiveSource('recording');
    }

    if (payload.type === 'proxy_connected') {
      console.info(`[Home] Backend realtime proxy accepted session ${payload.sessionId}.`);
      return;
    }

    if (payload.type === 'connected') {
      console.info('[Home] Deepgram realtime websocket connected through secure proxy.');
      setWsStatus('connected');
      flushPendingAudioChunks('deepgram-connected');
      return;
    }

    if (payload.type === 'transcript') {
      const data = payload.data;
      const transcript = (data.channel?.alternatives?.[0]?.transcript || '').trim();
      const isFinal = Boolean(data.is_final);
      const speechFinal = Boolean(data.speech_final);

      console.info(
        `[Home] STEP 6 verified: transcript event received by frontend. is_final=${isFinal}, speech_final=${speechFinal}, chars=${transcript.length}, text="${transcript}"`
      );

      if (!transcript) {
        if (!isFinal) {
          setInterimText('');
        }
        return;
      }

      if (isFinal) {
        appendFinalTranscript(data, transcript);
        setInterimText('');
        console.info('[Home] STEP 7 verified: finalized transcript segment rendered into stable buffer.');
      } else {
        setInterimText(transcript);
        console.info('[Home] STEP 7 verified: interim transcript rendered as transient live caption.');
      }
      return;
    }

    if (payload.type === 'Results') {
      handleRealtimePayload({
        type: 'transcript',
        data: payload
      });
      return;
    }

    if (payload.type === 'metadata' || payload.type === 'deepgram_event') {
      console.info(`[Home] Deepgram non-transcript event received. type=${payload.data?.type}`, payload.data);
      return;
    }

    if (payload.type === 'error') {
      const message = payload.message || 'Realtime speech stream error.';
      console.error('[Home] Server-side realtime stream error:', message);
      setRealtimeError(message);
      setWsStatus('error');
      setAppState('error');
      return;
    }

    if (payload.type === 'closed') {
      console.info('[Home] Realtime stream closed by backend:', payload.message);
      return;
    }

    console.warn('[Home] Unknown realtime websocket payload:', payload);
  }

  // Establish connection to backend WebSocket proxy securely
  function connectWebSocket(sessionId) {
    if (wsRef.current) {
      closeRealtimeSocket('replace-existing-session', { sendCloseStream: true });
    }

    setWsStatus('connecting');
    setRealtimeError('');

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    let protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    let wsHost = 'localhost:5001';

    try {
      const url = new URL(apiBaseUrl);
      protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      wsHost = url.host;
    } catch (e) {
      console.warn('[Home] Falling back to default host target for WebSocket connection.', e);
    }

    const wsUrl = `${protocol}//${wsHost}/api/realtime?sessionId=${sessionId}`;
    console.info(`[Home] Connecting secure WebSocket proxy: ${wsUrl}`);

    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      if (sessionIdRef.current !== sessionId) {
        console.warn(`[Home] Ignoring stale websocket open for session ${sessionId}.`);
        return;
      }

      console.info(`[Home] STEP 1 verified: backend WebSocket opened. session=${sessionId}, state=${ws.readyState}`);
      flushPendingAudioChunks('client-websocket-open');
    };

    ws.onmessage = (event) => {
      if (sessionIdRef.current !== sessionId) {
        console.warn(`[Home] Ignoring stale websocket message for session ${sessionId}.`);
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        handleRealtimePayload(payload);
      } catch (err) {
        console.error('[Home] Error parsing realtime socket frame:', err, event.data);
        setRealtimeError(`Could not parse realtime websocket frame: ${err.message}`);
        setWsStatus('error');
      }
    };

    ws.onerror = (err) => {
      if (sessionIdRef.current !== sessionId) {
        console.warn(`[Home] Ignoring stale websocket error for session ${sessionId}.`);
        return;
      }

      console.error('[Home] Realtime WebSocket error encountered:', err);
      setRealtimeError('Browser websocket error while connecting to realtime transcription proxy.');
      setWsStatus('error');
    };

    ws.onclose = (event) => {
      const expectedClose = expectedSocketClosesRef.current.has(ws);
      console.info(
        `[Home] Realtime WebSocket disconnected. session=${sessionId}, code=${event.code}, reason=${event.reason}, expected=${expectedClose}`
      );

      if (wsRef.current === ws) {
        wsRef.current = null;
      }

      if (sessionIdRef.current === sessionId) {
        setWsStatus(expectedClose ? 'disconnected' : 'error');
        if (!expectedClose && appStateRef.current === 'recording') {
          const message = `Realtime websocket closed unexpectedly. code=${event.code}, reason=${event.reason || 'none'}`;
          setRealtimeError(message);
          console.error('[Home]', message);
          setAppState('error');
        }
      }
    };
  }

  // Callback to stream encoded chunks to backend WebSocket proxy
  const handleChunkAvailable = async (blob) => {
    // Mandated client debug logs
    console.log('[Home] MediaRecorder packet observed:', {
      wsState: wsRef.current ? wsRef.current.readyState : 'null',
      wsStatus: wsStatusRef.current,
      chunkSize: blob ? blob.size : 'undefined',
      chunkType: blob ? blob.type : 'undefined',
      mediaRecorderState: recordingStatusRef.current,
      appState: appStateRef.current,
      isStopping: isStoppingRealtimeRef.current
    });

    if (!blob || blob.size === 0) {
      console.info('[Home] Ignoring empty realtime audio packet before websocket send.');
      return;
    }

    if (appStateRef.current !== 'recording' && !isStoppingRealtimeRef.current) {
      console.info(`[Home] Dropping packet because realtime recording is inactive. appState=${appStateRef.current}`);
      return;
    }

    const sessionId = sessionIdRef.current;
    const sequence = streamSequenceRef.current;

    try {
      const buffer = await blob.arrayBuffer();

      if (sessionIdRef.current !== sessionId || streamSequenceRef.current !== sequence) {
        console.warn(`[Home] Dropping stale converted audio packet. session=${sessionId}, sequence=${sequence}`);
        return;
      }

      const packet = {
        buffer,
        byteLength: buffer.byteLength,
        sessionId,
        sequence
      };

      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(buffer);
        console.log(`[Home] STEP 2/6 sent realtime audio packet. session=${sessionId}, bytes=${buffer.byteLength}`);
        return;
      }

      if (pendingAudioChunksRef.current.length >= REALTIME_AUDIO_QUEUE_LIMIT) {
        const message = `Realtime audio queue overflow. queuedPackets=${pendingAudioChunksRef.current.length}`;
        console.error('[Home]', message);
        setRealtimeError(message);
        setWsStatus('error');
        return;
      }

      pendingAudioChunksRef.current.push(packet);
      console.info(
        `[Home] Queued realtime audio packet until websocket opens. session=${sessionId}, bytes=${buffer.byteLength}, queuedPackets=${pendingAudioChunksRef.current.length}`
      );
    } catch (err) {
      console.error('[Home] Failed to convert realtime audio Blob to ArrayBuffer:', err);
      setRealtimeError(`Failed to read microphone packet: ${err.message}`);
      setWsStatus('error');
    }
  };

  // Initialize recording hook with dynamic timeslice (500ms default)
  const {
    status: recordingStatus,
    duration,
    audioLevels,
    recordedBlob,
    recordedUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording
  } = useAudioRecorder({
    timeslice: 500, // configurable low latency interval
    onChunkAvailable: (blob) => handleChunkAvailable(blob)
  });

  useEffect(() => {
    recordingStatusRef.current = recordingStatus;
  }, [recordingStatus]);

  // Initialize transcription display hook
  const {
    transcriptLines,
    isTranscribing,
    startTranscription,
    resetTranscription
  } = useTranscription(transcriptionData);

  // Dynamic visualizer levels array synced to 24 bars
  const [processingLevels, setProcessingLevels] = useState(Array(24).fill(0.06));
  const displayLevels = appState === 'uploading' || appState === 'transcribing'
    ? processingLevels
    : audioLevels;
  const shouldRenderRealtimeTranscript =
    realtimeLines.length > 0 ||
    (activeSource === 'recording' && ['recording', 'paused', 'completed'].includes(appState));

  // Sync visualizer data
  useEffect(() => {
    if (appState === 'uploading' || appState === 'transcribing') {
      // Simulate reading/analyzing file visuals during uploads and transcription
      const interval = setInterval(() => {
        setProcessingLevels(
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
    }
  }, [appState]);

  // Handle transition to completed once transcription typing finishes
  useEffect(() => {
    if (appState === 'transcribing' && !isTranscribing && transcriptLines.length > 0) {
      console.info('[TRANSCRIPTION_COMPLETED] Transcript successfully loaded and typed out.');
      queueMicrotask(() => {
        setAppState('completed');
      });
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
      queueMicrotask(() => {
        setRealtimeError('Microphone or MediaRecorder failed. Check browser microphone permission and WebM/Opus support.');
        setWsStatus('error');
        setAppState('error');
      });
    }
  }, [recordingStatus]);

  // Watch for recordedBlob from the hook and upload it for database persistence
  useEffect(() => {
    if (recordedBlob && activeSource === 'recording' && appState === 'completed') {
      console.info('[Home] Live audio blob captured. Dispatched to uploader for database persistence.');
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

      if (user) {
        setHistoryRefreshTrigger((prev) => prev + 1);
      }

    } catch (err) {
      console.error('[TRANSCRIPTION_FAILED] Error during Speech-to-Text pipeline:', err);
      setAppState('error');
    }
  };

  // Recording actions orchestration
  const handleRecordStart = async () => {
    if (isStartingRealtimeRef.current || appStateRef.current === 'recording') {
      console.warn('[Home] Duplicate realtime start prevented.');
      return;
    }

    isStartingRealtimeRef.current = true;
    isStoppingRealtimeRef.current = false;
    console.info('[RECORDER_STARTED] Initializing true realtime browser recording.');
    setActiveSource('recording');
    setAppState('recording');

    // Reset progressive states
    setStableSegments([]);
    setInterimText('');
    setRealtimeError('');
    pendingAudioChunksRef.current = [];
    finalSegmentKeysRef.current = new Set();
    streamSequenceRef.current += 1;
    recordingStartTimeRef.current = new Date();
    setRealtimeStartedAtLabel(formatTimestamp(recordingStartTimeRef.current));

    // 1. Generate unique session ID to prevent duplicate stream events
    const sessionId = Math.random().toString(36).substring(2, 15) + Date.now();
    sessionIdRef.current = sessionId;

    // 2. Establish connection to WebSocket proxy server
    connectWebSocket(sessionId);

    // 3. Start recording chunks using mediaRecorder
    try {
      await startRecording();
      console.info(`[Home] STEP 2 verified: MediaRecorder start requested with 500ms timeslices. session=${sessionId}`);
    } finally {
      isStartingRealtimeRef.current = false;
    }
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
    console.info('[Home] Stopping realtime recording. Finalizing websocket stream; REST upload is intentionally skipped.');
    isStoppingRealtimeRef.current = true;
    stopRecording();

    closeSocketTimerRef.current = setTimeout(() => {
      flushPendingAudioChunks('record-stop-before-finalize');
      sendRealtimeControl('Finalize', 'record-stop');

      closeSocketTimerRef.current = setTimeout(() => {
        closeRealtimeSocket('record-stop-finalized', { sendCloseStream: true });
        isStoppingRealtimeRef.current = false;
      }, 1400);
    }, 250);

    setAppState('completed');
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
    // Explicitly disconnect any active WebSocket stream
    closeRealtimeSocket('workspace-clear', { sendCloseStream: true });

    resetRecording();
    resetTranscription();
    setTranscriptionData([]);
    setActiveSource('none');
    setAppState('idle');

    // Reset progressive states
    setStableSegments([]);
    setInterimText('');
    setRealtimeError('');
    setRealtimeStartedAtLabel('');
    pendingAudioChunksRef.current = [];
    finalSegmentKeysRef.current = new Set();
    streamSequenceRef.current += 1;
    isStartingRealtimeRef.current = false;
    isStoppingRealtimeRef.current = false;
    recordingStartTimeRef.current = null;
    sessionIdRef.current = null;
    setWsStatus('disconnected');
  };

  return (
    <MainLayout appState={appState}>
      <section
        ref={workspaceRef}
        className="w-full pt-2 pb-16 scroll-mt-20"
      >
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className="mb-5 md:mb-7 flex items-end justify-between gap-6 select-none"
        >
          <div className="max-w-2xl">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-brand-muted mb-2">
              Realtime Listening Workspace
            </p>
            <h1 className="font-display text-3xl md:text-5xl leading-[0.95] tracking-tight text-brand-text">
              Speech flows into structure.
            </h1>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-text/70 animate-[pulse_2.6s_infinite]" />
            <span className="text-[11px] tracking-[0.18em] uppercase text-brand-muted">
              {wsStatus === 'connected' ? 'Stream Synced' : wsStatus === 'connecting' ? 'Linking Stream' : wsStatus === 'error' ? 'Stream Interrupted' : 'Standby'}
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-stretch"
        >
          <motion.div 
            variants={slideUpFade} 
            className="lg:col-span-3 h-full flex flex-col gap-4"
          >
            <UploadZone
              onUploadStart={handleUploadStart}
              onUploadComplete={handleUploadComplete}
              onReset={handleWorkspaceClear}
              isRecordingActive={appState === 'recording' || appState === 'paused'}
            />
            <HistoryPanel refreshTrigger={historyRefreshTrigger} />
          </motion.div>

          <motion.div 
            variants={slideUpFade} 
            className="lg:col-span-7 flex flex-col gap-4 h-full justify-between"
          >
            <div className="flex-1 min-h-[560px]">
              <TranscriptPanel
                transcriptLines={
                  shouldRenderRealtimeTranscript
                    ? realtimeLines
                    : transcriptLines
                }
                isTranscribing={appState === 'transcribing' || appState === 'recording'}
                appState={appState}
                wsStatus={wsStatus}
                errorMessage={realtimeError}
                onClear={handleWorkspaceClear}
              />
            </div>

            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="sticky bottom-3 z-20"
            >
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
            </motion.div>
          </motion.div>

          <motion.div
            variants={slideUpFade}
            className="lg:col-span-2 flex flex-col gap-4"
          >
            <WaveformVisualizer
              audioLevels={displayLevels}
              isRecording={appState === 'recording' || appState === 'uploading' || appState === 'transcribing'}
            />

            {recordedUrl && appState === 'completed' && (
              <motion.div
                variants={fadeIn}
                initial="initial"
                animate="animate"
                className="glass-panel border border-brand-border/55 rounded-2xl p-3 flex flex-col gap-2"
              >
                <span className="text-[10px] font-sans font-bold tracking-[0.2em] text-brand-muted uppercase">
                  Playback
                </span>
                <audio src={recordedUrl} controls className="h-8 w-full" />
              </motion.div>
            )}

            <motion.div
              variants={fadeIn}
              initial="initial"
              animate="animate"
              className="glass-panel rounded-2xl border border-brand-border/55 p-3.5"
            >
              <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted mb-2">Session Pulse</p>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px] text-brand-muted">
                  <span>State</span>
                  <span className="text-brand-text capitalize">{appState}</span>
                </div>
                <div className="flex justify-between text-[11px] text-brand-muted">
                  <span>Socket</span>
                  <span className="text-brand-text capitalize">{wsStatus}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

    </MainLayout>
  );
};
