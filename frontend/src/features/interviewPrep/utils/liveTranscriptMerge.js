/**
 * Pure helpers for merging Vapi/Deepgram live transcript events into turns.
 *
 * Observed Vapi client message shape (docs + schema):
 * {
 *   type: 'transcript' | 'transcript[transcriptType="final"]',
 *   role: 'assistant' | 'user',
 *   transcriptType: 'partial' | 'final',
 *   transcript: string
 * }
 *
 * Partials are typically cumulative for the in-progress utterance (replace preview).
 * Finals are usually complete utterance segments — multiple finals can arrive for
 * the same speaker before the other speaks (append into one bubble, with a
 * cumulative-replace guard if the new text extends the previous).
 */

const KNOWN_USER_ROLES = new Set(['user', 'customer']);
const KNOWN_ASSISTANT_ROLES = new Set(['assistant', 'bot', 'ai']);

/** True when role is a recognized Vapi speaker role. */
export const isKnownTranscriptRole = (roleRaw) => {
  const r = String(roleRaw ?? '')
    .trim()
    .toLowerCase();
  return KNOWN_USER_ROLES.has(r) || KNOWN_ASSISTANT_ROLES.has(r);
};

/**
 * Normalize role to `user` | `assistant`, or `null` when missing/unexpected
 * (caller should skip — do not guess and mis-attribute).
 */
export const normalizeTranscriptRole = (roleRaw) => {
  const r = String(roleRaw ?? '')
    .trim()
    .toLowerCase();
  if (KNOWN_USER_ROLES.has(r)) return 'user';
  if (KNOWN_ASSISTANT_ROLES.has(r)) return 'assistant';
  return null;
};

export const roleToSpeaker = (role) => (role === 'user' ? 'user' : 'ai');

export const isTranscriptMessage = (message) => {
  if (!message || typeof message !== 'object') return false;
  const type = String(message.type || '');
  return type === 'transcript' || type.startsWith('transcript');
};

export const resolveTranscriptType = (message) => {
  const explicit = String(message?.transcriptType || '').toLowerCase();
  if (explicit === 'partial' || explicit === 'final') return explicit;
  const type = String(message?.type || '');
  if (type.includes('partial')) return 'partial';
  if (type.includes('final')) return 'final';
  // Unknown — treat as final so we don't discard committed speech.
  return 'final';
};

const LEADING_PUNCT_RE = /^[.,!?;:]+/;

/**
 * Join two transcript segments without doubling spaces or duplicating overlap.
 * Keeps a space between words; does not insert a space before leading punctuation
 * (e.g. "Yes" + "." → "Yes.").
 */
export const joinTranscriptSegments = (existing, incoming) => {
  const left = String(existing || '').replace(/\s+/g, ' ').trim();
  const right = String(incoming || '').replace(/\s+/g, ' ').trim();
  if (!left) return right;
  if (!right) return left;
  if (left === right) return left;
  if (left.endsWith(right)) return left;
  if (right.startsWith(left)) return right;

  // Overlap when a cumulative update shares a trailing/leading phrase.
  const maxOverlap = Math.min(left.length, right.length);
  for (let size = maxOverlap; size >= 8; size -= 1) {
    if (left.slice(-size) === right.slice(0, size)) {
      return `${left}${right.slice(size)}`.replace(/\s+/g, ' ').trim();
    }
  }

  if (LEADING_PUNCT_RE.test(right)) {
    return `${left}${right}`.replace(/\s+/g, ' ').trim();
  }

  return `${left} ${right}`.replace(/\s+/g, ' ').trim();
};

/**
 * Merge a final segment into the turns array (immutable).
 * Safe for empty `turns` (first event of the call) and rapid sequential merges.
 *
 * @param {Array<{ id: string, speaker: string, role: string, text: string, timestamp?: number }>} turns
 * @param {{ speaker: string, role: string, text: string, id?: string, timestamp?: number }} segment
 */
export const mergeFinalTranscriptTurn = (turns, segment) => {
  const list = Array.isArray(turns) ? turns : [];
  const text = String(segment?.text || '').replace(/\s+/g, ' ').trim();
  if (!text) return list;

  const speaker = segment.speaker === 'user' ? 'user' : 'ai';
  const role = segment.role === 'user' ? 'user' : 'assistant';
  const last = list[list.length - 1];

  if (last && last.speaker === speaker) {
    const prevText = String(last.text || '').trim();
    let nextText = prevText;

    if (!prevText) {
      nextText = text;
    } else if (text === prevText) {
      return list;
    } else if (text.startsWith(prevText)) {
      // Cumulative final for the same utterance — replace.
      nextText = text;
    } else {
      // New utterance segment from the same speaker — append.
      nextText = joinTranscriptSegments(prevText, text);
    }

    if (nextText === prevText) return list;
    return [
      ...list.slice(0, -1),
      {
        ...last,
        text: nextText,
        timestamp: segment.timestamp || Date.now(),
      },
    ];
  }

  return [
    ...list,
    {
      id: segment.id || `turn-${list.length + 1}`,
      speaker,
      role,
      text,
      timestamp: segment.timestamp || Date.now(),
    },
  ];
};

/**
 * Map UI turns to the submit payload shape expected by POST /interview/live/submit.
 * Shape unchanged: `{ role, content }[]` with role `user` | `assistant`.
 * Never includes live partial preview text (preview is separate UI state).
 */
export const turnsToSubmitTranscript = (turns = []) =>
  (Array.isArray(turns) ? turns : [])
    .map((turn) => {
      const role = normalizeTranscriptRole(turn?.role || turn?.speaker);
      const content = String(turn?.text || turn?.content || '').trim();
      if (!role || !content) return null;
      return { role, content };
    })
    .filter(Boolean);
