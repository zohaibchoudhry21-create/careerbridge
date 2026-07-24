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

export const MOCK_INTERVIEW_ROLES = [
  { id: 'frontend-developer', label: 'Frontend Developer' },
  { id: 'backend-developer', label: 'Backend Developer' },
  { id: 'fullstack-developer', label: 'Full Stack Developer' },
  { id: 'data-analyst', label: 'Data Analyst' },
  { id: 'product-manager', label: 'Product Manager' },
  { id: 'hr-general', label: 'HR / Behavioral Round' },
];

/** Live analysis during answer recording (face-api + Web Audio heuristics). */
export const LIVE_VIDEO_SAMPLE_INTERVAL_MS = 400;
export const LIVE_AUDIO_SAMPLE_INTERVAL_MS = 250;
/** Fallback when user disables live indicators or on slower devices. */
export const LIVE_VIDEO_SAMPLE_INTERVAL_SLOW_MS = 700;
export const LIVE_ANALYSIS_PREFERENCE_KEY = 'interviewPrep.liveAnalysisEnabled';
