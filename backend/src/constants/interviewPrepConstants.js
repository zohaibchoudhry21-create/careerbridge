export const MOCK_INTERVIEW_DIFFICULTIES = ['easy', 'medium', 'hard'];

/** `standard` / `voiceCall` kept for older sessions; new interviews use `live`. */
export const MOCK_INTERVIEW_MODES = ['standard', 'voiceCall', 'legacy', 'live'];

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

/**
 * Delivery modes stored on session.
 * `text_only` is reserved for a future turn-by-turn Groq path — do not expose in UI
 * until that flow is implemented (see docs/interview-prep-architecture.md).
 */
export const INTERVIEW_SETUP_MODES = ['video_voice', 'voice_only', 'text_only'];
/** Modes accepted on new live starts / shown as working. */
export const INTERVIEW_SETUP_MODES_SELECTABLE = ['video_voice', 'voice_only'];
export const DEFAULT_INTERVIEW_SETUP_MODE = 'video_voice';

/** Interviewer tone for live Vapi sessions. */
export const INTERVIEWER_PERSONAS = ['friendly', 'neutral', 'strict', 'panel'];
export const DEFAULT_INTERVIEWER_PERSONA = 'neutral';

export const MAX_INTERVIEW_CONTEXT_TEXT_LENGTH = 15000;

/** Max audio duration for Whisper voice analysis (20 minutes). */
export const MAX_VOICE_AUDIO_DURATION_MS = 1_200_000;

/**
 * Static opening questions when Groq is unavailable after retries.
 * Keyed by coarse role keywords; falls back to `default`.
 */
export const FALLBACK_OPENING_QUESTIONS = {
  default:
    'Thanks for joining today. Could you briefly introduce yourself and walk me through your most relevant experience for this role?',
  frontend:
    'Thanks for joining. Could you introduce yourself and describe a recent frontend project you are proud of?',
  backend:
    'Thanks for joining. Could you introduce yourself and explain a backend system or API you have built or owned?',
  fullstack:
    'Thanks for joining. Could you introduce yourself and walk me through an end-to-end feature you shipped?',
  data:
    'Thanks for joining. Could you introduce yourself and describe a data problem you analyzed and the impact of your work?',
  product:
    'Thanks for joining. Could you introduce yourself and share how you typically prioritize product decisions?',
  hr: 'Thanks for joining. Could you introduce yourself and tell me about a time you worked through a challenging team situation?',
};

export const resolveFallbackOpeningQuestion = (roleLabel = '') => {
  const key = String(roleLabel || '').toLowerCase();
  if (/front|react|ui|ux/.test(key)) return FALLBACK_OPENING_QUESTIONS.frontend;
  if (/back|node|api|server|java|python/.test(key)) return FALLBACK_OPENING_QUESTIONS.backend;
  if (/full\s*stack|fullstack/.test(key)) return FALLBACK_OPENING_QUESTIONS.fullstack;
  if (/data|analyst|ml|machine/.test(key)) return FALLBACK_OPENING_QUESTIONS.data;
  if (/product|pm\b/.test(key)) return FALLBACK_OPENING_QUESTIONS.product;
  if (/hr|behavioral|people/.test(key)) return FALLBACK_OPENING_QUESTIONS.hr;
  return FALLBACK_OPENING_QUESTIONS.default;
};

export const DEFAULT_SKILL_QUIZ_QUESTION_COUNT = 12;

export const MIN_SKILL_QUIZ_QUESTIONS = 10;
export const MAX_SKILL_QUIZ_QUESTIONS = 15;

/** Configurable topic list for skill assessments (extend as needed). */
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

/** Paginated Interview History list (not the report-progress chart). */
export const INTERVIEW_HISTORY_DEFAULT_PAGE = 1;
export const INTERVIEW_HISTORY_DEFAULT_LIMIT = 10;
export const INTERVIEW_HISTORY_MAX_LIMIT = 20;

export const MOCK_INTERVIEW_ROLES = [
  { id: 'frontend-developer', label: 'Frontend Developer' },
  { id: 'backend-developer', label: 'Backend Developer' },
  { id: 'fullstack-developer', label: 'Full Stack Developer' },
  { id: 'data-analyst', label: 'Data Analyst' },
  { id: 'product-manager', label: 'Product Manager' },
  { id: 'hr-general', label: 'HR / Behavioral Round' },
];
