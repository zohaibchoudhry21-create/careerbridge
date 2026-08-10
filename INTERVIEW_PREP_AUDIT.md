# Interview Prep Feature — Full Audit

**Date:** 2026-08-09  
**Scope:** Read-only analysis of frontend, backend, and python-service for Interview Prep / mock interview / skill assessment.  
**No code was modified for this audit** (aside from creating this document).

---

## 1. Architecture Overview

### 1.1 Related files & folders

#### Frontend pages (`frontend/src/pages/InterviewPrep/`)
| File | Role |
|------|------|
| `InterviewPrepPage.jsx` | Hub entry |
| `MockInterviewLayout.jsx` | Media context wrapper + outlet |
| `MockInterviewSetupPage.jsx` | Live mock setup |
| `MockInterviewSessionPage.jsx` | Live session + report |
| `SkillAssessmentSetupPage.jsx` | Skill quiz setup |
| `SkillAssessmentQuizPage.jsx` | Quiz take/results |

#### Frontend feature module (`frontend/src/features/interviewPrep/` — ~60 files)
- **Components:** `InterviewPrepHub`, `MockInterviewSetup`, `InterviewSetupAdvanced`, `LiveInterview`, `LiveInterviewAgent`, `LiveInterviewReportView`, `AIInterviewerAvatar`, 3D/2D avatar helpers, skill quiz UI, report subcomponents (`ExecutiveSummaryCard`, `HiringCard`, `DimensionGrid`, `QuestionReviewList`, `RoadmapCard`, `TimelineList`, `EnterpriseCharts`, `ScoreRing`, etc.)
- **Hooks:** `useLiveInterview`, `useMockInterview`, `useSkillAssessment`, `useFaceVideoAnalysis`, `useLiveAudioMonitor`, `useMediaPermissions`
- **Services:** `mockInterviewService.js`, `skillAssessmentService.js`
- **Lib:** `vapi.sdk.js` (`@vapi-ai/web` wrapper)
- **Config / constants / utils:** speech & behavioral monitoring, video metrics, pitch detect, persona helpers, etc.
- **i18n:** `frontend/src/i18n/locales/{en,es,ur}/interviewPrep.json`
- **Related UI:** `frontend/src/components/home/InterviewPrepSteps.jsx`, `frontend/src/components/dashboard/InterviewReadinessCard.jsx`
- **Assets:** `frontend/public/models/interviewer/` (3D avatar)

#### Frontend routes (`frontend/src/App.jsx`)
- `/interview-prep` — hub  
- `/interview-prep/skills` — skill setup  
- `/interview-prep/skills/:quizId` — quiz  
- `/interview-prep/mock` — setup  
- `/interview-prep/mock/:sessionId` — live session  

#### Backend routes (mounted at `/api` in `backend/src/app.js`)
| File | Mount |
|------|--------|
| `backend/src/routes/mockInterviewRoutes.js` | `/api/interview/...` |
| `backend/src/routes/skillQuizRoutes.js` | `/api/skills/...` |
| `backend/src/routes/voiceAnalysisRoutes.js` | `/api/analysis/voice` |
| `backend/src/routes/videoAnalysisRoutes.js` | `/api/analysis/video` |

#### Backend controllers / models / services
- Controllers: `mockInterviewController.js`, `skillQuizController.js`, `voiceAnalysisController.js`, `videoAnalysisController.js`
- Models: `MockInterviewSession.js`, `InterviewReport.js`, `SkillQuiz.js`
- Report pipeline: `backend/src/services/interviewReport/` (assembler, builders, Groq narrative, serializers, fixtures, tests)
- Intelligence: `backend/src/services/interviewIntelligence/`
- Speech: `backend/src/services/speechAnalysis/`
- Utils: `vapiAssistantService.js`, `interviewerPromptBuilder.js`, `mockInterviewGroqService.js`, `mockInterviewReportGroqService.js`, `skillQuizGroqService.js`, `voiceAnalysis*.js`, `interviewResumeAnalysisGroqService.js`, `roleSuggestionsGroqService.js`, etc.
- Config: `vapiInterviewerConfig.js`, `interviewReportConfig.js`, `interviewIntelligenceConfig.js`, `speechMonitoringConfig.js`, `behavioralMonitoringConfig.js`, `interviewPerfConfig.js`
- Middleware: `interviewPrepRateLimiters.js`, upload middlewares, validators

#### Docs (secondary; may lag code)
- `docs/interview-prep-architecture.md`
- `docs/INTERVIEW_SYSTEM_OPTIMIZATIONS.md`
- Mentions in `FEATURES_WORKING.md`

#### Python service
**No Interview Prep involvement.** Grep over `python-service` for interview / vapi / skill-quiz / mock-interview returned **zero matches**. FastAPI is used for resume/ATS extraction elsewhere, not for this feature.

---

### 1.2 Tech stack (this feature)

| Layer | Technology |
|-------|------------|
| Frontend | React, React Router, TanStack Query, Axios, `@vapi-ai/web`, `face-api.js`, Three.js / React Three Fiber / Drei, Chart.js / react-chartjs-2 |
| Backend | Express REST under `/api`, Mongoose / MongoDB, `groq-sdk` |
| Live voice interview | **Vapi** (server creates assistant via REST `fetch`; browser uses public web token). Default interviewer LLM: **OpenAI `gpt-4o-mini`** (via Vapi). Default STT: **Deepgram `nova-2`**. Voices: Vapi built-ins (Elliot / Savannah / Rohan) |
| Scoring / quizzes / briefs / resume analysis | **Groq** (`GROQ_MODEL`, default `llama-3.3-70b-versatile`); Whisper model env for optional audio upload path |
| Claude / Anthropic | Not used on Interview Prep code paths (may exist for other product features) |
| Transport | CareerBridge APIs: **REST only**. Real-time audio: **Vapi’s WebRTC/WebSocket** to Vapi cloud (not a custom app WebSocket) |
| Python FastAPI | **Not used** by Interview Prep |

---

### 1.3 Frontend ↔ backend communication

1. Authenticated Axios (`withCredentials`) to `/api/...` (see `mockInterviewService.js` / `skillAssessmentService.js`).
2. Live call: browser receives `assistantId` from `POST /interview/live/start`, then `vapi.start(assistantId)` with `VITE_VAPI_WEB_TOKEN`.
3. After call: FE posts full transcript + client-computed audio/video hints to `POST /interview/live/submit` (timeout 120s).
4. **Not used by live FE path:** `POST /analysis/voice` and `POST /analysis/video` (exist as standalone endpoints; live flow embeds metrics in submit body instead).

---

## 2. Data Flow

### 2.1 Live mock interview (primary path)

```
User opens /interview-prep/mock
  → optional: POST /interview/resume/analyze (multipart resume)
  → optional: POST /interview/role-suggestions
  → POST /interview/live/start
       → prepareInterviewIntelligence (context brief + Groq question guide)
       → MockInterviewSession.create (mode: "live", status: "active")
       → createVapiAssistantForSession (system prompt from session + guide)
       → response: { sessionId, assistantId, ... }

Navigate /interview-prep/mock/:sessionId
  → vapi.start(assistantId)
  → client: face-api + Web Audio monitors (if video_voice)
  → on end: POST /interview/live/submit
       { sessionId, transcript[], liveAudioHints?, liveVideoMetrics?, durationMs? }
       → normalize transcript
       → Groq voice analysis (+ optional speech monitoring, non-fatal)
       → persist video/audio metrics on session
       → persistMockInterviewReport (relevance gate → dimensions → narrative Groq → hiring)
       → InterviewReport upsert + session.status = completed, session.reportId
       → serialized report returned

UI: LiveInterviewReportView (enterprise preferred, legacy fallback)
```

**Sent to backend (submit):** transcript turns (`role`/`content`), optional live audio hints (volume, silence, pauses), optional live video metrics (eye contact, expressions, engagement, behavioral timeline), durationMs.

**Processed:** voice scoring, speech monitoring, relevance gating per Q&A pairs extracted from transcript vs planned questions, content dimensions, delivery blend, enterprise narrative, hiring band.

**Stored:** `MockInterviewSession` (transcript, metrics, questions, brief, Vapi id, status), `InterviewReport` (scores, sections, enterprise payload, scoreVersion).

**Returned:** full serialized report (+ `cached: true` on idempotent resubmit when `scoreVersion` matches `SCORING_LOGIC_VERSION`).

### 2.2 Skill assessment path

```
POST /skills/generate-quiz → Groq MCQs → SkillQuiz
GET  /skills/quiz/:quizId
POST /skills/submit-quiz → deterministic scoreSkillQuiz → scoredResult on SkillQuiz
UI: SkillQuizResults (no InterviewReport write)
```

### 2.3 API endpoints (all `protect` unless noted)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/interview/live/start` | Start live session + Vapi assistant |
| POST | `/api/interview/live/submit` | Submit transcript/metrics; build report |
| POST | `/api/interview/resume/analyze` | Resume → skills/projects summary |
| POST | `/api/interview/role-suggestions` | Role autocomplete (Groq) |
| GET | `/api/interview/session/:sessionId` | Fetch session (live hides question bank from client in controller logic) |
| GET | `/api/interview/reports/history` | Prior mock reports |
| POST | `/api/interview/report` | Regenerate/fetch report for a session |
| GET | `/api/skills/topics` | Topic list |
| POST | `/api/skills/generate-quiz` | Groq MCQ generation |
| GET | `/api/skills/quiz/:quizId` | Fetch quiz |
| POST | `/api/skills/submit-quiz` | Score answers |
| POST | `/api/analysis/voice` | Whisper / transcript → voice metrics (standalone) |
| POST | `/api/analysis/video` | Aggregate client frame samples (standalone) |

### 2.4 Database models / schemas

#### `MockInterviewSession` (`backend/src/models/MockInterviewSession.js`)
- `userId`, `role`, `roleLabel`, `difficulty` (easy\|medium\|hard)
- `mode` (standard\|voiceCall\|legacy\|**live** — new sessions set `live`)
- `voiceCallTranscript[]` `{ role, content }`
- `callLiveAudioHints`, `callLiveVideoMetrics`, `callVoiceMetrics`, `callVideoMetrics`
- `callSpeechMetrics`, `speechTimelineEvents`, `callDurationMs`
- `status` (setup\|active\|processing\|completed\|abandoned)
- `durationMinutes` (10\|15\|20), `targetQuestionCount`, `answerTimeLimitSeconds`, `currentQuestionIndex`
- `questions[]` `{ questionId, text, order, focusTag?, depthHint? }`
- `answers[]` `{ questionId, transcript, voiceMetrics, videoMetrics, liveVideoMetrics, liveAudioHints, durationMs, submittedAt }` — **schema leftover for turn-based; live path primarily uses call-level transcript**
- `reportId`, `resumeText`, `experience`, `resumeSkills[]`, `resumeProjects[]`
- `jobDescriptionText`, `targetCompany`, `focusAreas[]`
- `interviewMode` (video_voice\|voice_only\|**text_only**)
- `interviewerPersona` (friendly\|neutral\|strict\|panel)
- `vapiAssistantId`, `interviewContextBrief` (Mixed)
- timestamps

#### `InterviewReport`
- `userId`, `sourceType` (`mock_interview` \| `skill_assessment`), `sourceId`
- `overallScore`, `scoreVersion`
- `sections`: `contentQuality`, `voiceAnalysis`, `videoAnalysis`, `skillAssessment` (flexible nested scores/feedback)
- `strengths[]`, `improvementAreas[]`, `recommendedNextSteps[]` (max 10 each)
- `flaggedForReview`, `rawMetricsSnapshot` (select:false), `enterpriseReport` (Mixed)
- Unique index: `(sourceType, sourceId)`

#### `SkillQuiz`
- `userId`, `topic`, `topicLabel`, `difficulty`, `questionCount` (10–15)
- `status` (pending\|in_progress\|submitted)
- `questions[]` `{ questionId, question, options[], correctIndex, explanation, subtopic }`
- `answers[]` `{ questionId, selectedIndex }`
- `scoredResult` `{ score, total, percentage, weakAreas[], reviewList[] }`
- `reportId` (present but **unused** by submit controller)
- `expiresAt`

---

## 3. Question Generation Logic

### 3.1 Live interview — dynamic AI guide (not a static bank)

1. **`prepareInterviewIntelligence`** builds a deterministic **context brief** (role, experience, skills, projects, resume/JD excerpts, focus areas).
2. **`generateInterviewQuestionGuide`** (`questionGuideGroqService.js`) calls Groq for **5 / 6 / 8** questions based on duration (10→5, 15→6, 20→8).
3. Guide is embedded into **`buildInterviewerSystemPrompt`** and sent to Vapi. The live model may adapt wording; scaffolds may say “generate wording live.”
4. If Groq disabled/unavailable: **`buildFallbackQuestionGuide`** — role-aware opener + improvisation scaffolds.

#### Actual Groq prompt (question guide)

```text
You are designing a live voice interview guide for a ${difficulty} ${roleLabel} role.
Target about ${durationMinutes} minutes. Generate exactly ${expectedCount} distinct interview questions.
Focus areas to emphasize: ${focusLine}.
${briefBlock}
Rules:
- First question must be a warm opening / intro style question.
- Cover focus areas across the set; vary topics (do not repeat).
- Ground questions in the brief when present (skills, projects, JD) without inventing facts.
- Questions must be spoken-friendly (one clear ask each).
- No answer keys. No markdown.

Return JSON only:
{
  "questions": [
    { "text": "string", "focusTag": "opening|behavioral|leadership|system_design|coding|case_study|communication|general", "depthHint": "warmup|standard|deep" }
  ]
}
```

#### Vapi system prompt (excerpt — identity)

```text
You are a real human hiring interviewer conducting a live voice interview. You are NOT a chatbot, tutor, or voice assistant. Speak the way an experienced HR / hiring interviewer speaks on a video call.
```

(Full assembly: role, difficulty, duration, focus areas, candidate brief, persona, intelligence policies, numbered question guide, opening/closing rules — `interviewerPromptBuilder.js`.)

### 3.2 Personalization

**Yes, when provided:** resume analysis → skills/projects/summary; job description; company; focus areas; difficulty; persona; duration. Without resume/JD, guide is still role/difficulty/focus personalized but less grounded.

### 3.3 Skill quiz questions

Groq MCQ generation (`skillQuizGroqService.js`):

```text
You are an expert technical interviewer. Generate exactly ${questionCount} multiple-choice questions for a skill assessment.
Topic: ${topicLabel}
Difficulty: ${difficulty}
...
- exactly N questions, 4 options, correctIndex 0-3, vary subtopics
```

Topics come from hardcoded topic lists in interview prep constants (not resume-personalized).

### 3.4 Dead / superseded

- `generateOpeningQuestion` in `mockInterviewGroqService.js` is **exported but not imported by any controller** (dead for live path). Architecture docs that still describe it as the start-path opener are **out of date**.

---

## 4. Answer Evaluation Logic

### 4.1 Live / mock interview — enterprise pipeline (`SCORING_LOGIC_VERSION = 7`)

**Phase 1 — deterministic relevance gate** (`evaluateAnswerRelevance.js`):

| Classification | Fixed score | Feedback |
|----------------|-------------|----------|
| `empty` | 0 | “No answer provided.” |
| `gibberish` | 1 | “Answer does not appear to address the question.” |
| `question_echo` | 1 | “Answer restates the question without providing a substantive response.” |
| `off_topic` | 1 | “Answer does not appear to address the question.” |
| `on_topic` | (proceed to AI / dimension scoring) | — |

Uses token overlap / echo heuristics (no network). Non-on-topic answers **skip** Groq per-question scoring.

**Phase 2 — content dimensions** (`interviewReportConfig.js` weights):

| Dimension | Weight |
|-----------|--------|
| communication | 0.16 |
| technicalSkills | 0.18 |
| behavior | 0.12 |
| confidence | 0.12 |
| leadership | 0.10 |
| problemSolving | 0.16 |
| criticalThinking | 0.16 |

Content core comes from gated question scores; AI narrative can fine-tune within caps. **Confidence** is delivery-influenced and can be capped when content is near-zero.

**Delivery blend weights:** dimensions 0.7, voice 0.15, presence 0.15 — but **max delivery influence on overall is +10** (`MAX_DELIVERY_INFLUENCE_ON_OVERALL`). Content ceiling logic prevents empty/gibberish interviews from scoring high via delivery alone.

**Hiring bands** (`HIRING_BANDS`):

| Min overall | Decision |
|-------------|----------|
| ≥ 85 | `hire` |
| ≥ 72 | `lean_hire` |
| ≥ 55 | `hold` |
| else | `no_hire` |

**Enterprise narrative Groq** (`enterpriseNarrativeGroq.js` / `mockInterviewReportGroqService.js`): produces executive summary, hiring rationale, strengths/weaknesses, roadmap, legacy-style section feedback. Prompt instructs: do **not** invent scores for empty/gibberish/off-topic/echo answers (those are deterministic).

**Voice:** local WPM / fillers / pauseRatio + Groq `confidenceScore` / `toneLabel` / `feedbackText`. Speech monitoring runs in parallel on submit and is **non-fatal** on failure.

**Injection heuristic:** suspicious transcript phrases → `flaggedForReview`.

### 4.2 Skill quiz evaluation

**No LLM grading.** `scoreSkillQuiz` compares `selectedIndex` to `correctIndex`; percentage = `score/total*100`; weak areas by subtopic accuracy.

---

## 5. Report Generation

### 5.1 How it is built

`persistMockInterviewReport` (`interviewReportService.js`) → snapshot → `assembleInterviewReport` (builders + optional Groq narrative) → upsert `InterviewReport` with `scoreVersion: SCORING_LOGIC_VERSION` (7).

### 5.2 Fields / metrics

**Legacy sections:** `contentQuality`, `voiceAnalysis` (wpm, confidence, fillers, feedback), `videoAnalysis` (eye contact, engagement, feedback), lists of strengths / improvement areas / next steps.

**Enterprise payload (preferred UI):** executive summary, hiring recommendation + probability, overall score, content dimensions + per-question reviews, delivery (voice / body language / eye contact), strengths/weaknesses/improvement areas, learning roadmap, career suggestions, timeline, chart data.

### 5.3 Storage vs on-the-fly

**Stored in MongoDB** (`InterviewReport`). Submit is idempotent: returns cached report if `scoreVersion` is current; otherwise regenerates.

Skill quiz results live on **`SkillQuiz.scoredResult` only** — not as `InterviewReport` despite `sourceType: skill_assessment` existing on the report model.

### 5.4 Frontend display

| Component | Path |
|-----------|------|
| Main report view | `frontend/src/features/interviewPrep/components/LiveInterviewReportView.jsx` |
| Enterprise cards | `.../report/ExecutiveSummaryCard.jsx`, `HiringCard.jsx`, `DimensionGrid.jsx`, `QuestionReviewList.jsx`, `RoadmapCard.jsx`, `TimelineList.jsx`, `EnterpriseCharts.jsx`, `ScoreRing.jsx` |
| Progress history | `InterviewProgressChart.jsx` + `GET /interview/reports/history` |
| Skill results | `SkillQuizResults.jsx`, `SkillQuizMcq.jsx` |
| Dashboard | `InterviewReadinessCard.jsx` |

---

## 6. Current Limitations / Gaps

| Issue | Detail |
|-------|--------|
| **Doc vs code** | Docs mentioning `generateOpeningQuestion` on start conflict with live path (`question guide` + intelligence). |
| **Dead opener util** | `mockInterviewGroqService.generateOpeningQuestion` unused by controllers. |
| **Turn-based / standard mode** | Schema fields (`answers[]`, `currentQuestionIndex`) and rate-limiter comments referencing “next-question / submit-answer” remain; **no such write routes**. New sessions always `mode: 'live'`. |
| **`text_only` interview mode** | In schema enum; constants say reserved / **do not expose in UI**. |
| **`skill_assessment` InterviewReport** | Enum + `SkillQuiz.reportId` exist; submit **never creates** an `InterviewReport`. |
| **Standalone `/analysis/*`** | Implemented; **live FE does not call them** (metrics bundled into submit). |
| **Client-trusted metrics** | Audio/video hints are client-supplied; can be spoofed or incomplete. |
| **Prompt injection** | Mitigated via heuristics / flagging, not eliminated. |
| **Error handling asymmetry** | Speech analysis failure on submit is swallowed; narrative/report Groq failure can fail the whole submit. |
| **Deprecated helpers** | Multiple `@deprecated` builders kept for tests/compat (`CONTENT_CEILING_PADDING`, old overall helpers, etc.). |
| **FastAPI coupling** | **None** for this feature — not a simplification target here. |
| **FEATURES_WORKING / rate-limit comments** | May describe optional analysis calls or endpoints that no longer exist in the live FE path. |

---

## 7. Dependencies

### npm — backend (`backend/package.json`)
- `groq-sdk` (primary AI for guides, reports, quizzes, voice scoring)
- Express / Mongoose / multer stack (shared)
- Vapi: **no official npm SDK** — HTTP `fetch` to Vapi REST with private key

### npm — frontend (`frontend/package.json`)
- `@vapi-ai/web`
- `face-api.js`
- `three`, `@react-three/fiber`, `@react-three/drei`
- `chart.js`, `react-chartjs-2`
- Axios / React Query / React Router (shared app)

### Python
- **None for Interview Prep**

### External APIs / env (feature-relevant)

**Backend**
- `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FAST_MODEL`, `GROQ_WHISPER_MODEL`
- `VAPI_PRIVATE_KEY` (or `VAPI_API_KEY`), optional `VAPI_INTERVIEWER_MODEL` (default `gpt-4o-mini`), voice/transcriber/endpointing envs
- `INTERVIEW_REPORT_GROQ_ENABLED`, `INTERVIEW_INTEL_GUIDE_GROQ_ENABLED`
- Report payload caps / cache TTLs (`interviewPerfConfig`, `interviewReportConfig`)

**Frontend**
- `VITE_VAPI_WEB_TOKEN`
- Optional `VITE_INTERVIEWER_AVATAR_URL`

**Via Vapi (cloud)**
- OpenAI (interviewer LLM), Deepgram (transcription), Vapi voices

---

## 8. Summary Table

| Component | File path (representative) | Purpose | Status |
|-----------|----------------------------|---------|--------|
| Interview Prep hub + routing | `frontend/src/pages/InterviewPrep/*`, `App.jsx` | Navigation / entry | **Working** |
| Skill quiz generate / take / score | `skillQuizController.js`, `SkillQuizMcq.jsx`, `skillQuizScoring.js` | MCQ assessment | **Working** |
| Skill → `InterviewReport` | `InterviewReport.sourceType`, `SkillQuiz.reportId` | Persist skill as enterprise report | **Broken / unimplemented** |
| Live mock setup | `MockInterviewSetup.jsx`, `InterviewSetupAdvanced.jsx` | Role, resume, persona, mode | **Working** |
| Question guide + context brief | `interviewIntelligence/`, `questionGuideGroqService.js` | Personalized Q guide | **Working** |
| Opening-question Groq helper | `mockInterviewGroqService.js` | Legacy opener | **Dead / unused** |
| Vapi assistant + live call | `vapiAssistantService.js`, `useLiveInterview.js`, `vapi.sdk.js` | Real-time voice interview | **Working** (needs API keys) |
| Client face / audio monitoring | `useFaceVideoAnalysis.js`, `useLiveAudioMonitor.js` | Delivery metrics | **Working** |
| Live submit → enterprise report | `submitLiveInterview`, `services/interviewReport/` | Score + persist report | **Working** |
| Report UI (enterprise + legacy) | `LiveInterviewReportView.jsx`, `report/*` | Display results | **Working** |
| Report history / readiness | `InterviewProgressChart.jsx`, `InterviewReadinessCard.jsx` | Trends | **Working** |
| Standalone voice/video analysis APIs | `voiceAnalysisRoutes.js`, `videoAnalysisRoutes.js` | Optional analysis | **Partial** (unused by live FE) |
| Turn-based Q&A interview | Session `answers[]` schema / old comments | Non-live flow | **Abandoned / broken** |
| `text_only` mode | `MockInterviewSession.interviewMode` | Future text path | **Incomplete / reserved** |
| Python FastAPI | `python-service/` | N/A for this feature | **N/A** |

---

## Conflicts & unclear points (explicit)

1. **Opening question path:** Code uses full **question guide**; `generateOpeningQuestion` is dead; some docs still describe the old opener — treat docs as secondary.
2. **`FEATURES_WORKING` / rate-limiter comments** vs live FE: comments mention next-question / submit-answer and optional `/analysis/*` in the mock flow; live FE only uses start/submit (+ resume/role helpers).
3. **Skill assessment reporting:** Model allows `skill_assessment` reports, but controller never writes them — intentional gap vs incomplete migration is unclear from code alone; behaviorally **unimplemented**.
4. **Dual scoring narratives:** Deterministic gates + dimension builders are source of truth for scores; Groq narrative must not override gated zeros — enforced in prompts and assemblers; older “legacy categories” (Communication Skills, Technical Knowledge, etc.) still appear in narrative schemas for backward-compatible sections.

---

*End of audit.*
