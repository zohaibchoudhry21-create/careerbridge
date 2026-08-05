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

export const DEFAULT_MOCK_QUESTION_COUNT = 6;

export const MIN_MOCK_QUESTIONS = 5;
export const MAX_MOCK_QUESTIONS = 8;

/** Live interview duration options (minutes). */
export const MOCK_INTERVIEW_DURATION_OPTIONS = [10, 15, 20];
export const DEFAULT_MOCK_INTERVIEW_DURATION_MINUTES = 15;

/** Maps interview duration to Groq question-set size. */
export const durationMinutesToQuestionCount = (durationMinutes) => {
  const minutes = Number(durationMinutes);
  if (minutes <= 10) return 5;
  if (minutes >= 20) return 8;
  return 6;
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

/** Optional interview delivery modes (stored on session; full text_only support is future scope). */
export const INTERVIEW_SETUP_MODES = ['video_voice', 'voice_only', 'text_only'];
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

export const MOCK_INTERVIEW_ROLES = [
  { id: 'frontend-developer', label: 'Frontend Developer' },
  { id: 'backend-developer', label: 'Backend Developer' },
  { id: 'fullstack-developer', label: 'Full Stack Developer' },
  { id: 'data-analyst', label: 'Data Analyst' },
  { id: 'product-manager', label: 'Product Manager' },
  { id: 'hr-general', label: 'HR / Behavioral Round' },
];
