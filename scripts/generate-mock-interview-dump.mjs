#!/usr/bin/env node
/**
 * Consolidates AI Mock Interview / Interview Prep source into one shareable dump.
 * Usage: node scripts/generate-mock-interview-dump.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outPath = path.join(root, 'mock_interview_full_code_export.md');

/** Logical order: types/constants → models → backend → frontend → i18n → wiring */
const files = [
  // --- Types / constants ---
  'backend/src/types/interviewPrepTypes.js',
  'backend/src/constants/interviewPrepConstants.js',
  'frontend/src/features/interviewPrep/constants/interviewPrepConstants.js',
  'frontend/src/features/interviewPrep/constants/voiceCallAssistant.js',
  'frontend/src/features/interviewPrep/config/interviewerAvatarConfig.js',

  // --- Models ---
  'backend/src/models/MockInterviewSession.js',
  'backend/src/models/InterviewReport.js',
  'backend/src/models/SkillQuiz.js',

  // --- Backend middleware / validators ---
  'backend/src/middleware/interviewPrepRateLimiters.js',
  'backend/src/middleware/interviewContextUploadMiddleware.js',
  'backend/src/middleware/mockInterviewUploadMiddleware.js',
  'backend/src/validators/mockInterviewValidator.js',
  'backend/src/validators/skillQuizValidator.js',
  'backend/src/validators/voiceAnalysisValidator.js',
  'backend/src/validators/videoAnalysisValidator.js',

  // --- Backend routes / controllers ---
  'backend/src/routes/mockInterviewRoutes.js',
  'backend/src/routes/skillQuizRoutes.js',
  'backend/src/routes/voiceAnalysisRoutes.js',
  'backend/src/routes/videoAnalysisRoutes.js',
  'backend/src/controllers/mockInterviewController.js',
  'backend/src/controllers/skillQuizController.js',
  'backend/src/controllers/voiceAnalysisController.js',
  'backend/src/controllers/videoAnalysisController.js',

  // --- Backend AI / utils ---
  'backend/src/config/groqConfig.js',
  'backend/src/utils/mockInterviewGroqService.js',
  'backend/src/utils/mockInterviewReportGroqService.js',
  'backend/src/utils/mockInterviewReportBuilder.js',
  'backend/src/utils/interviewReportSerializer.js',
  'backend/src/utils/interviewResumeAnalysisGroqService.js',
  'backend/src/utils/roleSuggestionsGroqService.js',
  'backend/src/utils/skillQuizGroqService.js',
  'backend/src/utils/skillQuizScoring.js',
  'backend/src/utils/skillQuizSerializer.js',
  'backend/src/utils/groqWhisperService.js',
  'backend/src/utils/voiceAnalysisService.js',
  'backend/src/utils/voiceAnalysisGroqService.js',
  'backend/src/utils/voiceAnalysisMetrics.js',
  'backend/src/utils/videoAnalysisMetrics.js',
  'backend/src/utils/interviewPrepRateLimitKey.js',
  'backend/src/utils/skillQuizScoring.test.js',
  'backend/src/utils/voiceAnalysisMetrics.test.js',
  'backend/src/utils/videoAnalysisMetrics.test.js',
  'backend/src/utils/interviewPrepRateLimitKey.test.js',

  // --- Frontend pages ---
  'frontend/src/pages/InterviewPrep/InterviewPrepPage.jsx',
  'frontend/src/pages/InterviewPrep/MockInterviewLayout.jsx',
  'frontend/src/pages/InterviewPrep/MockInterviewSetupPage.jsx',
  'frontend/src/pages/InterviewPrep/MockInterviewSessionPage.jsx',
  'frontend/src/pages/InterviewPrep/SkillAssessmentSetupPage.jsx',
  'frontend/src/pages/InterviewPrep/SkillAssessmentQuizPage.jsx',

  // --- Frontend services / hooks / context ---
  'frontend/src/features/interviewPrep/services/mockInterviewService.js',
  'frontend/src/features/interviewPrep/services/skillAssessmentService.js',
  'frontend/src/features/interviewPrep/hooks/useMockInterview.js',
  'frontend/src/features/interviewPrep/hooks/useLiveInterview.js',
  'frontend/src/features/interviewPrep/hooks/useSkillAssessment.js',
  'frontend/src/features/interviewPrep/hooks/useMediaPermissions.js',
  'frontend/src/features/interviewPrep/hooks/useLiveAudioMonitor.js',
  'frontend/src/features/interviewPrep/hooks/useFaceVideoAnalysis.js',
  'frontend/src/features/interviewPrep/context/InterviewMediaContext.jsx',
  'frontend/src/features/interviewPrep/lib/vapi.sdk.js',

  // --- Frontend utils ---
  'frontend/src/features/interviewPrep/utils/apiErrorUtils.js',
  'frontend/src/features/interviewPrep/utils/interviewerPersona.js',
  'frontend/src/features/interviewPrep/utils/mediaPermissionUtils.js',
  'frontend/src/features/interviewPrep/utils/videoAnalysisMetrics.js',
  'frontend/src/features/interviewPrep/utils/webglSupport.js',
  'frontend/src/features/interviewPrep/utils/avatarRig.js',
  'frontend/src/features/interviewPrep/utils/avatarMouthMorphs.js',

  // --- Frontend components ---
  'frontend/src/features/interviewPrep/components/InterviewPrepHub.jsx',
  'frontend/src/features/interviewPrep/components/MockInterviewSetup.jsx',
  'frontend/src/features/interviewPrep/components/InterviewSetupAdvanced.jsx',
  'frontend/src/features/interviewPrep/components/RoleAutocompleteInput.jsx',
  'frontend/src/features/interviewPrep/components/RoleResumeCard.jsx',
  'frontend/src/features/interviewPrep/components/LiveInterview.jsx',
  'frontend/src/features/interviewPrep/components/LiveInterviewAgent.jsx',
  'frontend/src/features/interviewPrep/components/LiveInterviewReportView.jsx',
  'frontend/src/features/interviewPrep/components/LiveVideoIndicator.jsx',
  'frontend/src/features/interviewPrep/components/AIInterviewerAvatar.jsx',
  'frontend/src/features/interviewPrep/components/InterviewerAvatar3DScene.jsx',
  'frontend/src/features/interviewPrep/components/InterviewerAvatar2DFallback.jsx',
  'frontend/src/features/interviewPrep/components/SkillAssessmentSetup.jsx',
  'frontend/src/features/interviewPrep/components/SkillQuizMcq.jsx',
  'frontend/src/features/interviewPrep/components/SkillQuizResults.jsx',
  'frontend/src/features/interviewPrep/components/InterviewProgressChart.jsx',
  'frontend/src/features/interviewPrep/components/RetryErrorPanel.jsx',
  'frontend/src/components/dashboard/InterviewReadinessCard.jsx',

  // --- Assets (text) ---
  'frontend/src/features/interviewPrep/lottie/interviewer-aura.json',
  'frontend/public/models/interviewer/LICENSE.md',
  'frontend/scripts/download-interviewer-avatar.mjs',

  // --- i18n ---
  'frontend/src/i18n/locales/en/interviewPrep.json',
  'frontend/src/i18n/locales/es/interviewPrep.json',
  'frontend/src/i18n/locales/ur/interviewPrep.json',

  // --- Shared wiring (full files — needed for mounts / errors / routes) ---
  'backend/src/constants/apiErrorCodes.js',
  'frontend/src/App.jsx',
  'frontend/src/i18n/index.js',
  'frontend/src/components/dashboard/dashboardConstants.js',
  'FEATURES_WORKING.md',
];

const binaryNotes = `
## Binary / non-text assets (NOT inlined — present in repo)

3D interviewer animations:
- frontend/public/models/interviewer/animations/idle.glb
- frontend/public/models/interviewer/animations/listening.glb
- frontend/public/models/interviewer/animations/speaking.glb
- frontend/public/models/interviewer/animations/thinking.glb
- frontend/public/models/interviewer/interviewer-avatar.glb (may be downloaded via script; see .env.example)

face-api.js weights (live video analysis):
- frontend/public/models/tiny_face_detector_model-*
- frontend/public/models/face_landmark_68_model-*
- frontend/public/models/face_expression_model-*

## Shared mounts (also see full App.jsx / apiErrorCodes below)

backend/src/app.js mounts:
  app.use('/api', skillQuizRoutes);
  app.use('/api', mockInterviewRoutes);
  app.use('/api', voiceAnalysisRoutes);
  app.use('/api', videoAnalysisRoutes);
`;

const summary = `# AI Mock Interview / Interview Prep — Full Code Export

Generated for external AI analysis. Product: **AI CareerBridge** (FYP).

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React 18, Vite, React Router, TanStack Query, i18next, Tailwind, Motion, Lucide |
| Live voice | **Vapi** (\`@vapi-ai/web\`) |
| Avatar / video | Three.js / React Three Fiber, face-api.js, Lottie |
| Backend | Node.js, Express (ESM) |
| Database | MongoDB (Mongoose) — \`MockInterviewSession\`, \`InterviewReport\`, \`SkillQuiz\` |
| AI / LLM | **Groq** (chat for questions/reports/quiz/role suggestions; Whisper for voice transcription) |
| Auth | JWT + session middleware (\`protect\`) on all interview APIs |

## Feature scope

Interview Prep hub has **two tracks**:
1. **Skill Assessment** — MCQ quiz generated by Groq for a topic/difficulty
2. **AI Mock Interview (live)** — Vapi voice call with AI interviewer + optional voice/video metrics + Groq post-interview report

## Basic flow (step by step)

### A) Skill Assessment
1. User opens \`/interview-prep\` → chooses Skill Assessment
2. Setup: topic, difficulty, question count (\`SkillAssessmentSetup\`)
3. \`POST\` skill-quiz generate → Groq returns MCQs → saved as \`SkillQuiz\`
4. User answers on quiz page → submit → scoring (\`skillQuizScoring\`) → results UI

### B) AI Mock Interview (live)
1. Setup on \`/interview-prep/mock\`: target role, resume context (upload/text), JD, difficulty, duration, persona, focus areas
2. Backend may analyze resume (Groq) and suggest roles; creates \`MockInterviewSession\`
3. Session page starts **Vapi** live call (\`LiveInterview\` / \`LiveInterviewAgent\`) with interviewer system prompt / persona
4. During call: optional mic level monitor + face-api video metrics (client) → can POST voice/video analysis
5. On end: transcript sent → Groq builds structured \`InterviewReport\` (scores, feedback, strengths/gaps)
6. User views report (\`LiveInterviewReportView\`)

## File order in this dump

1. Types / constants / config  
2. DB models  
3. Backend middleware, validators, routes, controllers  
4. Backend AI services & metrics utils (+ tests)  
5. Frontend pages → services → hooks → components  
6. i18n + shared wiring (\`App.jsx\`, error codes)

---
${binaryNotes}
---

# SOURCE FILES
`;

const missing = [];
const parts = [summary];

for (const rel of files) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) {
    missing.push(rel);
    parts.push(`\n===================================\nFILE: ${rel}\n===================================\n[MISSING — file not found on disk]\n`);
    continue;
  }
  const content = fs.readFileSync(abs, 'utf8');
  parts.push(`\n===================================\nFILE: ${rel}\n===================================\n${content}`);
  if (!content.endsWith('\n')) parts.push('\n');
}

parts.push(`\n\n---\nEnd of export. Files included: ${files.length - missing.length}/${files.length}.`);
if (missing.length) {
  parts.push(`\nMissing: ${missing.join(', ')}`);
}

fs.writeFileSync(outPath, parts.join(''), 'utf8');
const sizeMb = (fs.statSync(outPath).size / (1024 * 1024)).toFixed(2);
console.log(`Wrote ${outPath}`);
console.log(`Size: ${sizeMb} MB`);
console.log(`Included: ${files.length - missing.length}/${files.length}`);
if (missing.length) console.warn('Missing:', missing);
