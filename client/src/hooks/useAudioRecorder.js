import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to interface with the browser's MediaRecorder and Web Audio APIs.
 * Connects the microphone input to an AnalyserNode, samples frequency data,
 * averages it into 24 bars, and captures physical audio Blobs.
 */
export const useAudioRecorder = () => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'paused' | 'completed' | 'error'
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState(Array(24).fill(0.06));
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  const isRecording = status === 'recording';

  // Requests microphone permission and initializes real audio streams
  const startRecording = async () => {
    try {
      console.info('[AudioRecorder] Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.info('[AudioRecorder] Microphone access granted.');
      streamRef.current = stream;

      // Set up Web Audio API nodes for visualizer rendering
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const sourceNode = audioCtx.createMediaStreamSource(stream);
      const analyserNode = audioCtx.createAnalyser();
      
      analyserNode.fftSize = 64; // Low bin size for lightweight CPU/memory footprint
      sourceNode.connect(analyserNode);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyserNode;

      // Initialize MediaRecorder
      const options = { mimeType: 'audio/webm' };
      let mediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, options);
      } catch (e) {
        console.warn('[AudioRecorder] webm mimetype not supported, falling back to standard audio options', e);
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.info('[AudioRecorder] MediaRecorder stopped.');
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        console.info(`[AudioRecorder] Generated audio blob. Size: ${blob.size} bytes. Mime: ${blob.type}`);
        
        setRecordedBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        setStatus('completed');
      };

      // Clean up previous recordings
      setRecordedBlob(null);
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(null);
      }

      // Start recording slices
      mediaRecorder.start(250); 
      console.info('[AudioRecorder] MediaRecorder started.');
      setStatus('recording');
      setDuration(0);

      // Launch the visualizer data extraction loop
      startVisualizerLoop(analyserNode);

    } catch (err) {
      console.error('[AudioRecorder] Failed to start recording:', err);
      setStatus('error');
    }
  };

  // Lightweight frame loop sampling mic frequencies and downsampling to 24 bars
  const startVisualizerLoop = (analyser) => {
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const updateWaveform = () => {
      if (!analyserRef.current || !audioContextRef.current || audioContextRef.current.state === 'closed') {
        return;
      }
      
      analyser.getByteFrequencyData(dataArray);

      // Map frequency bin array into 24 distinct visualizer bars
      const numBars = 24;
      const step = Math.floor(bufferLength / numBars) || 1;
      const newLevels = [];

      for (let i = 0; i < numBars; i++) {
        let sum = 0;
        const start = i * step;
        const end = Math.min(start + step, bufferLength);
        for (let j = start; j < end; j++) {
          sum += dataArray[j];
        }
        
        const avg = sum / (end - start || 1);
        let val = avg / 255; // Normalize to 0.0 -> 1.0 range
        
        // Bell-curve density factor (elevates center bars, dampens outer edges)
        const mid = (numBars - 1) / 2;
        const dist = Math.abs(i - mid);
        const bellFactor = Math.max(0.18, 1 - dist / (mid + 1));
        
        // Add a scaling boost for readability
        newLevels.push(Math.max(0.08, val * bellFactor * 1.6));
      }

      setAudioLevels(newLevels);
      animationFrameRef.current = requestAnimationFrame(updateWaveform);
    };

    updateWaveform();
  };

  // Manage stopwatch duration timer
  useEffect(() => {
    if (status === 'recording') {
      timerRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Idle "breathing" waveform effect when not active
  useEffect(() => {
    let idleInterval;
    if (status === 'idle') {
      idleInterval = setInterval(() => {
        setAudioLevels((prevLevels) => {
          return prevLevels.map((_, index) => {
            const mid = (prevLevels.length - 1) / 2;
            const distance = Math.abs(index - mid);
            const factor = Math.max(0.2, 1 - distance / (mid + 1.5));
            const breathingVal = Math.sin(Date.now() / 900 + index * 0.25) * 0.04 + 0.12;
            return Math.max(0.06, breathingVal * factor);
          });
        });
      }, 100);
    } else if (status !== 'recording' && status !== 'paused') {
      // Stopped or completed: flatline the visualizer
      setAudioLevels(Array(24).fill(0.06));
    }

    return () => {
      if (idleInterval) clearInterval(idleInterval);
    };
  }, [status]);

  const pauseRecording = () => {
    if (mediaRecorderRef.current && status === 'recording') {
      console.info('[AudioRecorder] Pausing MediaRecorder.');
      mediaRecorderRef.current.pause();
      if (audioContextRef.current) {
        audioContextRef.current.suspend();
      }
      setStatus('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && status === 'paused') {
      console.info('[AudioRecorder] Resuming MediaRecorder.');
      mediaRecorderRef.current.resume();
      if (audioContextRef.current) {
        audioContextRef.current.resume();
      }
      setStatus('recording');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && (status === 'recording' || status === 'paused')) {
      console.info('[AudioRecorder] Stopping MediaRecorder.');
      mediaRecorderRef.current.stop();
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Stop all mic tracks to switch off user's recording indicator light
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        console.info('[AudioRecorder] Mic stream tracks released.');
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const resetRecording = () => {
    console.info('[AudioRecorder] Resetting recorder.');
    if (timerRef.current) clearInterval(timerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
    }

    setStatus('idle');
    setDuration(0);
    setAudioLevels(Array(24).fill(0.06));
    setRecordedBlob(null);
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
  };

  return {
    status,
    isRecording,
    duration,
    audioLevels,
    recordedBlob,
    recordedUrl,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
};
