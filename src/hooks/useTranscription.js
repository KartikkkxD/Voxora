import { useState, useEffect, useRef } from 'react';
import { formatTimestamp } from '../utils/formatters';

/**
 * Custom hook to simulate typing speech-to-text with conversational pacing.
 * It renders text word-by-word, taking longer breaks at commas or periods,
 * and waits for speaker delay intervals before moving to the next line.
 * 
 * @param {Array} sourceData Array of speaker lines with text and delays
 */
export const useTranscription = (sourceData = []) => {
  const [transcriptLines, setTranscriptLines] = useState([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);

  const timeoutRef = useRef(null);
  const typingTimerRef = useRef(null);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const resetTranscription = () => {
    clearTimers();
    setTranscriptLines([]);
    setIsTranscribing(false);
    setCurrentLineIndex(-1);
  };

  const startTranscription = () => {
    if (!sourceData || sourceData.length === 0) return;
    resetTranscription();
    setIsTranscribing(true);
    setCurrentLineIndex(0);
  };

  const pauseTranscription = () => {
    clearTimers();
    setIsTranscribing(false);
  };

  const resumeTranscription = () => {
    if (currentLineIndex < 0 || currentLineIndex >= sourceData.length) return;
    setIsTranscribing(true);
  };

  // Run the typing simulator when a line changes or transcription is toggled
  useEffect(() => {
    if (isTranscribing && currentLineIndex >= 0 && currentLineIndex < sourceData.length) {
      simulateLineTyping(currentLineIndex);
    }
  }, [currentLineIndex, isTranscribing]);

  const simulateLineTyping = (lineIdx) => {
    clearTimers();
    const lineData = sourceData[lineIdx];
    const words = lineData.text.split(' ');
    let wordIdx = 0;
    
    const timestamp = formatTimestamp(new Date());

    setTranscriptLines((prev) => {
      // Avoid duplicate lines if resuming
      const exists = prev.some((l) => l.id === lineData.id);
      if (exists) return prev;
      return [
        ...prev,
        {
          id: lineData.id,
          speaker: lineData.speaker,
          text: '',
          timestamp,
          isTyping: true
        }
      ];
    });

    const typeNextWord = () => {
      if (wordIdx < words.length) {
        const nextWord = words[wordIdx];
        const partialText = words.slice(0, wordIdx + 1).join(' ');

        setTranscriptLines((prev) =>
          prev.map((l) => (l.id === lineData.id ? { ...l, text: partialText } : l))
        );

        // Realistic typing speed with subtle variation
        let delay = 140 + Math.random() * 90; // 140ms - 230ms per word
        
        // Punctuation delays for realism
        if (nextWord.endsWith(',') || nextWord.endsWith(';') || nextWord.endsWith('—')) {
          delay += 280; // comma pause
        } else if (nextWord.endsWith('.') || nextWord.endsWith('?') || nextWord.endsWith('!')) {
          delay += 550; // sentence-ending pause
        } else if (nextWord.endsWith('...')) {
          delay += 750; // ellipsis pause
        }

        wordIdx++;
        typingTimerRef.current = setTimeout(typeNextWord, delay);
      } else {
        // Line completed
        setTranscriptLines((prev) =>
          prev.map((l) => (l.id === lineData.id ? { ...l, isTyping: false } : l))
        );

        // Conversational gap before the next speaker/line begins
        const delayAfter = (lineData.delayAfter || 1.5) * 1000;
        timeoutRef.current = setTimeout(() => {
          if (lineIdx + 1 < sourceData.length) {
            setCurrentLineIndex(lineIdx + 1);
          } else {
            setIsTranscribing(false); // Fully finished
          }
        }, delayAfter);
      }
    };

    // Begin typing words
    typingTimerRef.current = setTimeout(typeNextWord, 200);
  };

  return {
    transcriptLines,
    isTranscribing,
    startTranscription,
    pauseTranscription,
    resumeTranscription,
    resetTranscription,
    currentLineIndex
  };
};
