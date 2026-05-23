import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to simulate audio recording behaviors, timer ticks, 
 * and dynamic waveform values for the visualizer.
 */
export const useAudioRecorder = () => {
  const [status, setStatus] = useState('idle'); // 'idle' | 'recording' | 'paused' | 'completed'
  const [duration, setDuration] = useState(0);
  const [audioLevels, setAudioLevels] = useState(Array(36).fill(0.08));
  
  const timerRef = useRef(null);

  const isRecording = status === 'recording';

  // Manage recording timer ticks
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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  // Manage simulated waveform levels for audio visualizer
  useEffect(() => {
    let levelInterval;

    if (status === 'recording') {
      // Dynamic conversational fluctuations
      levelInterval = setInterval(() => {
        setAudioLevels((prevLevels) => {
          return prevLevels.map((_, index) => {
            // Apply a bell curve filter (highest in the middle, lowest at sides)
            const mid = (prevLevels.length - 1) / 2;
            const distance = Math.abs(index - mid);
            const factor = Math.max(0.15, 1 - distance / (mid + 1));
            
            // Fluctuations mimicking speech rhythm with occasional pauses
            const timeSeed = Date.now();
            const voiceActivity = Math.sin(timeSeed / 400) * 0.4 + 0.6; // oscillates to simulate speech patterns
            
            // Random vocal peaks
            const randNoise = Math.random() * 0.45 + 0.1;
            
            let val = voiceActivity * factor * randNoise * 1.7;
            
            // Enforce minimum height so bars do not collapse completely
            return Math.max(0.08, Math.min(0.95, val));
          });
        });
      }, 70);
    } else if (status === 'idle') {
      // Calm slow-moving breathing waveform for idle state
      levelInterval = setInterval(() => {
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
    } else {
      // Paused or completed: steady flatlining bars with tiny residual buzz
      setAudioLevels(Array(36).fill(0.06));
    }

    return () => {
      if (levelInterval) {
        clearInterval(levelInterval);
      }
    };
  }, [status]);

  const startRecording = () => {
    setStatus('recording');
    setDuration(0);
  };

  const pauseRecording = () => {
    setStatus('paused');
  };

  const resumeRecording = () => {
    setStatus('recording');
  };

  const stopRecording = () => {
    setStatus('completed');
  };

  const resetRecording = () => {
    setStatus('idle');
    setDuration(0);
    setAudioLevels(Array(36).fill(0.08));
  };

  return {
    status,
    isRecording,
    duration,
    audioLevels,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
  };
};
