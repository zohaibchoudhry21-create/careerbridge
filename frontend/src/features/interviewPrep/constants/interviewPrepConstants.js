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
  { value: 'friendly', label: 'Friendly', description: 'Warm and encouraging' },
  { value: 'neutral', label: 'Neutral', description: 'Professional and balanced' },
  { value: 'strict', label: 'Strict', description: 'Formal and demanding' },
  { value: 'panel', label: 'Panel of 3', description: 'Multi-interviewer simulation' },
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
