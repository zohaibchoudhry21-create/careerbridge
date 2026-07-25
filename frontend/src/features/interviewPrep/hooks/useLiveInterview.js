import { useCallback, useRef, useState } from 'react';

/**
 * Holds the labeled transcript shown on the live interview screen.
 * `speaker` is either 'ai' or 'user' so the UI can render the right display name.
 */
export function useLiveInterview() {
  const [transcript, setTranscript] = useState([]);
  const turnCountRef = useRef(0);

  const addTurn = useCallback((speaker, text) => {
    const content = typeof text === 'string' ? text.trim() : '';
    if (!content) return;

    turnCountRef.current += 1;
    const id = `turn-${turnCountRef.current}`;
    const normalizedSpeaker = speaker === 'user' ? 'user' : 'ai';

    setTranscript((prev) => [
      ...prev,
      { id, speaker: normalizedSpeaker, text: content, timestamp: Date.now() },
    ]);
  }, []);

  const resetTranscript = useCallback(() => {
    turnCountRef.current = 0;
    setTranscript([]);
  }, []);

  return { transcript, addTurn, resetTranscript };
}

export default useLiveInterview;
