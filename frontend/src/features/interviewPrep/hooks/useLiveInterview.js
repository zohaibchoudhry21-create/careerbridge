import { useCallback, useRef, useState } from 'react';
import {
  isTranscriptMessage,
  mergeFinalTranscriptTurn,
  normalizeTranscriptRole,
  resolveTranscriptType,
  roleToSpeaker,
  turnsToSubmitTranscript,
} from '../utils/liveTranscriptMerge';

/**
 * Live transcript state for the interview UI + submit payload.
 *
 * - Finals: merge into one bubble per continuous speaker turn.
 * - Partials: livePreview only (replaced, never committed; never in submit).
 *
 * Rapid finals: `turnsRef` is updated synchronously before the next event can
 * run (single-threaded), so merges never read a stale array from a React
 * closure. setTranscript is also updated from that same next array.
 */
export function useLiveInterview() {
  const [transcript, setTranscript] = useState([]);
  /** @type {[{ speaker: 'ai'|'user', text: string } | null, Function]} */
  const [livePreview, setLivePreview] = useState(null);
  const turnCountRef = useRef(0);
  const turnsRef = useRef([]);

  /**
   * Commit merged turns: update the ref first (sync source of truth), then React state.
   */
  const commitTurns = useCallback((next) => {
    turnsRef.current = next;
    setTranscript(next);
  }, []);

  /**
   * Ingest a raw Vapi `message` event. Ignores non-transcript messages.
   * @param {object} message
   */
  const ingestVapiMessage = useCallback(
    (message) => {
      if (!isTranscriptMessage(message)) return;

      const transcriptType = resolveTranscriptType(message);
      const role = normalizeTranscriptRole(message.role);
      const text = String(message.transcript ?? '').replace(/\s+/g, ' ').trim();

      if (import.meta.env.DEV) {
        console.info('[live-transcript]', {
          type: message.type,
          role: message.role,
          transcriptType: message.transcriptType ?? transcriptType,
          transcript: text.slice(0, 160),
          len: text.length,
        });
      }

      // Missing / unexpected role — skip (do not default to assistant and corrupt turns).
      if (!role) {
        if (import.meta.env.DEV) {
          console.warn('[live-transcript] skipped event with unknown role:', message.role);
        }
        return;
      }

      if (!text) return;

      const speaker = roleToSpeaker(role);

      if (transcriptType === 'partial') {
        // Partials are cumulative for the current utterance — replace preview only.
        setLivePreview({ speaker, text });
        return;
      }

      // Final: clear preview for this speaker, merge into committed turns.
      setLivePreview((prev) => (prev?.speaker === speaker ? null : prev));

      turnCountRef.current += 1;
      // Read turnsRef (always latest), not React state — safe under rapid-fire finals.
      const next = mergeFinalTranscriptTurn(turnsRef.current, {
        id: `turn-${turnCountRef.current}`,
        speaker,
        role,
        text,
        timestamp: Date.now(),
      });
      commitTurns(next);
    },
    [commitTurns]
  );

  /** @deprecated Prefer ingestVapiMessage — kept for any direct callers. */
  const addTurn = useCallback(
    (speaker, text) => {
      const content = typeof text === 'string' ? text.trim() : '';
      if (!content) return;
      const normalizedSpeaker = speaker === 'user' ? 'user' : 'ai';
      const role = normalizedSpeaker === 'user' ? 'user' : 'assistant';
      turnCountRef.current += 1;
      const next = mergeFinalTranscriptTurn(turnsRef.current, {
        id: `turn-${turnCountRef.current}`,
        speaker: normalizedSpeaker,
        role,
        text: content,
        timestamp: Date.now(),
      });
      commitTurns(next);
    },
    [commitTurns]
  );

  const clearLivePreview = useCallback(() => {
    setLivePreview(null);
  }, []);

  const resetTranscript = useCallback(() => {
    turnCountRef.current = 0;
    turnsRef.current = [];
    setTranscript([]);
    setLivePreview(null);
  }, []);

  /**
   * Submit payload from committed turns only — never includes orphaned partials.
   */
  const getSubmitTranscript = useCallback(
    () => turnsToSubmitTranscript(turnsRef.current),
    []
  );

  return {
    transcript,
    livePreview,
    ingestVapiMessage,
    addTurn,
    clearLivePreview,
    resetTranscript,
    getSubmitTranscript,
  };
}

export default useLiveInterview;
