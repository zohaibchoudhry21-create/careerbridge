/** Keep in sync with backend/src/constants/interviewPrepConstants.js */

export const MOCK_INTERVIEW_DIFFICULTIES = ['easy', 'medium', 'hard'];

export const MOCK_INTERVIEW_MODES = {
  LEGACY: 'legacy',
  LIVE: 'live',
  /** @deprecated older sessions */
  STANDARD: 'standard',
  /** @deprecated older sessions */
  VOICE_CALL: 'voiceCall',
};

export const MOCK_INTERVIEW_STATUSES = [
  'setup',
  'active',
  'processing',
  'completed',
  'abandoned',
];

export const SKILL_QUIZ_STATUSES = ['pending', 'in_progress', 'submitted'];

export const INTERVIEW_REPORT_SOURCE_TYPES = ['mock_interview', 'skill_assessment'];

export const DEFAULT_MOCK_QUESTION_COUNT = 5;

export const MIN_MOCK_QUESTIONS = 4;
export const MAX_MOCK_QUESTIONS = 16;

/** Live interview duration: any whole minute from 1 up to 2 hours. */
export const MIN_MOCK_INTERVIEW_DURATION_MINUTES = 1;
export const MAX_MOCK_INTERVIEW_DURATION_MINUTES = 120;
/** Quick-select options in setup UI (user can also type any value in range). */
export const MOCK_INTERVIEW_DURATION_OPTIONS = [10, 15, 20];
export const DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES = 15;

/** Keep in sync with backend INTERVIEW_HISTORY_* constants. */
export const INTERVIEW_HISTORY_DEFAULT_PAGE = 1;
export const INTERVIEW_HISTORY_DEFAULT_LIMIT = 10;

export const clampDurationMinutes = (value) => {
  const minutes = Math.round(Number(value));
  if (!Number.isFinite(minutes)) return DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES;
  return Math.min(
    MAX_MOCK_INTERVIEW_DURATION_MINUTES,
    Math.max(MIN_MOCK_INTERVIEW_DURATION_MINUTES, minutes)
  );
};

/**
 * Guide size scales with duration (~1 question per 3 minutes), not fixed 5/6/8 buckets.
 * Live follow-ups are extra and are not part of this count.
 */
export const durationMinutesToQuestionCount = (durationMinutes) => {
  const minutes = Number(durationMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) return DEFAULT_MOCK_QUESTION_COUNT;
  const scaled = Math.round(minutes / 3);
  return Math.min(MAX_MOCK_QUESTIONS, Math.max(MIN_MOCK_QUESTIONS, scaled));
};

/** Optional focus areas for advanced interview setup. */
export const INTERVIEW_FOCUS_AREAS = [
  'System design',
  'Behavioral',
  'Coding',
  'Case study',
  'Leadership',
  'Communication',
];

/** Maps API focus-area values to interviewPrep i18n keys. */
export const FOCUS_AREA_I18N_KEYS = {
  'System design': 'systemDesign',
  Behavioral: 'behavioral',
  Coding: 'coding',
  'Case study': 'caseStudy',
  Leadership: 'leadership',
  Communication: 'communication',
};

/** Only fully implemented modes are selectable. text_only is backend-reserved. */
export const INTERVIEW_SETUP_MODE_OPTIONS = [
  { value: 'video_voice', label: 'Video and voice' },
  { value: 'voice_only', label: 'Voice only' },
];

export const DEFAULT_INTERVIEW_SETUP_MODE = 'video_voice';

export const INTERVIEWER_PERSONA_OPTIONS = [
  {
    value: 'friendly',
    label: 'Friendly',
    description: 'Warm HR-style interviewer — encouraging, natural pauses, supportive follow-ups',
  },
  {
    value: 'neutral',
    label: 'Neutral',
    description: 'Seasoned hiring manager — courteous, clear, efficient pacing',
  },
  {
    value: 'strict',
    label: 'Strict',
    description: 'Formal rigorous interviewer — concise answers, crisp probes',
  },
  {
    value: 'panel',
    label: 'Panel of 3',
    description: 'Technical lead + hiring manager + HR with natural hand-offs',
  },
];

export const DEFAULT_INTERVIEWER_PERSONA = 'neutral';

export const DEFAULT_SKILL_QUIZ_QUESTION_COUNT = 12;

export const MIN_SKILL_QUIZ_QUESTIONS = 10;
export const MAX_SKILL_QUIZ_QUESTIONS = 15;

export const SKILL_ASSESSMENT_TOPICS = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'react', label: 'React' },
  { id: 'sql', label: 'SQL' },
  { id: 'data-structures', label: 'Data Structures' },
  { id: 'nodejs', label: 'Node.js' },
  { id: 'python', label: 'Python' },
  { id: 'system-design', label: 'System Design' },
  { id: 'html-css', label: 'HTML & CSS' },
];

/** Live analysis during answer recording (face-api + Web Audio heuristics). */
export const LIVE_VIDEO_SAMPLE_INTERVAL_MS = 400;
export const LIVE_AUDIO_SAMPLE_INTERVAL_MS = 250;
/** Fallback when user disables live indicators or on slower devices. */
export const LIVE_VIDEO_SAMPLE_INTERVAL_SLOW_MS = 700;
