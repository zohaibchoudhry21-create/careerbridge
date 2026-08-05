# AI CareerBridge — Features Working Flow

This document explains how the main product features work end-to-end: frontend → backend → database / AI / Python services.

---

## Tech stack (high level)

| Layer | Tech |
|--------|------|
| Frontend | React (Vite) |
| Backend | Node.js / Express |
| Database | MongoDB (Mongoose) |
| AI | Groq / Gemini / Anthropic (Claude) |
| Resume extraction | Python service (PDF/DOCX/OCR) |

---

## 1. Auth & Account

**What it does:** Register, login, email verification, password reset, social login, and account settings.

**Main routes (frontend):**
- `/login`, `/register`
- `/forgot-password`, `/reset-password`
- `/verify-email`, `/verify-email-sent`
- `/auth/social/callback`
- `/settings` (personal info, login & security, appearance, account management)

**Working flow:**
1. User submits auth forms on the frontend.
2. Requests hit `authRoutes` / `userRoutes` / `socialAuthRoutes` / `verifyRoutes`.
3. Backend validates input, hashes passwords, issues sessions/tokens.
4. Data stored in MongoDB (`User`, `UserSession`, etc.).
5. Protected pages use `ProtectedRoute`; guest pages use `GuestRoute`.

**Key areas:**
- Backend: `backend/src/routes/authRoutes.js`, `userRoutes.js`, `socialAuthRoutes.js`
- Frontend: `frontend/src/pages/Login.jsx`, `Register.jsx`, `Settings/*`

---

## 2. Dashboard

**What it does:** Logged-in home / overview after authentication.

**Route:** `/dashboard`

**Working flow:**
1. User opens dashboard (protected).
2. Frontend calls dashboard APIs via `dashboardRoutes`.
3. Backend returns aggregated / overview data for the user.

**Key areas:**
- Backend: `backend/src/routes/dashboardRoutes.js`
- Frontend: `frontend/src/pages/Dashboard.jsx`

---

## 3. Resume Builder (AI Resume Parser)

**Goal:** Upload a CV → extract text → AI returns structured JSON → user edits / picks templates / views history.

### Working flow

```text
User uploads PDF/DOCX
        ↓
parsedResumeController.uploadParsedResume
        ↓
Save ParsedResume (status: uploaded → processing)
        ↓
extractTextFromResume (file → raw text)
        ↓
extractResumeData (aiParser.js)
        ↓
buildPrompt → Groq or Gemini (AI_PROVIDER)
        ↓
Parse JSON response
        ↓
Save ParsedResume.parsedData
        ↓
Frontend editor / details / history
```

### What JSON is used for
- AI is prompted to return **only JSON** (name, email, phone, skills, experience, education, projects, etc.).
- That JSON is stored in **`ParsedResume.parsedData`**.

### Key files
| Role | Path |
|------|------|
| Routes | `backend/src/routes/resumeBuilderRoutes.js` |
| Controller | `backend/src/controllers/parsedResumeController.js` |
| AI prompt + parse | `backend/src/utils/resumeParser/aiParser.js` |
| Groq call | `backend/src/utils/resumeParser/groqProvider.js` |
| Gemini call | `backend/src/utils/resumeParser/geminiProvider.js` |
| Model | `backend/src/models/ParsedResume.js` |
| UI | `frontend/src/pages/ResumeBuilder/*` |

### Frontend pages
- Upload: `/resume/upload`
- Editor: resume editor page
- Details / history: resume details & history pages

---

## 4. Resume Scanner (ATS)

**Goal:** Upload CV + job description → ATS-friendly structured resume → AI match score & suggestions → field-level Edit + Preview.

### Working flow

```text
User uploads CV + pastes JD
        ↓
POST /api/resume-scanner/upload
        ↓
Python extract → structuredResume JSON (+ derived resumeText)
        ↓
Background AI analyze (skills, scores, optimize suggestions)
        ↓
Multi-pass decision pipeline:
  Understand → Facts → JD → Similarity → Decide
        ↓
If optimize: field-path suggestions (existing scanner)
If rewrite: Plan → Rewrite all discovered nodes → Validate → pending_review
        ↓
User Accept rewrite → replace structuredResume → re-analyze
   or Reject → restore optimize suggestions
```

### Source of truth
- **`AtsAnalysis.structuredResume`** — structured JSON (name, contact, summary, workExperience, education, skills, languages).
- **`resumeText`** — derived flat ATS text via `generateAtsText()` only (not the primary edit model).
- Suggestions target a **`fieldPath`** (e.g. `workExperience.0.bullets.1`) instead of only global string offsets.

### Key files
| Role | Path |
|------|------|
| Routes | `backend/src/routes/resumeScannerRoutes.js` |
| Controller | `backend/src/controllers/resumeScannerController.js` |
| Structured model helpers | `backend/src/utils/structuredResume.js`, `resumeScannerSectionDetect.js` |
| AI prompts | `backend/src/utils/resumeScannerPrompts.js`, `resumeScannerPipeline/rewritePass.js` |
| Scoring / apply suggestion | `backend/src/utils/resumeScannerScoring.js` |
| Full rewrite (mismatch) | `backend/src/utils/resumeScannerRewriteService.js`, `resumeScannerMismatch.js` |
| Model | `backend/src/models/AtsAnalysis.js` |
| Python extract | `python-service/extractor.py`, `resume_extractor.py`, `ats_normalizer.py` |
| Edit UI | `frontend/src/features/resumeScanner/components/ResumeEditor.jsx` |
| Preview UI | `frontend/src/features/resumeScanner/components/StructuredResumeView.jsx` |
| Frontend utils | `frontend/src/features/resumeScanner/utils/structuredResumeUtils.js` |
| Pages | `frontend/src/pages/ResumeScanner/*` |

### Frontend pages
- Upload: `/resume-scanner`
- Analysis (Edit / Preview): `/resume-scanner/:analysisId` (or equivalent analysis route)

### Migration (existing analyses)
- Script: `backend/scripts/migrate-ats-structured-resume.mjs`
- Parses old flat `resumeText` into `structuredResume` (supports `--dry-run`)

---

## 5. Interview Prep

**What it does:** Skill quizzes and mock interviews (with optional voice/video analysis).

### Skill assessment
1. User chooses topic / difficulty (`SkillAssessmentSetupPage`).
2. Backend generates quiz (Groq) via `skillQuizRoutes`.
3. User answers on `SkillAssessmentQuizPage`.
4. Results stored (e.g. `SkillQuiz` model).

### Mock interview
1. Setup on `MockInterviewSetupPage` (role, resume context, persona, etc.).
2. `POST /interview/live/start` creates a Mongo session and a **server-side Vapi assistant** (`vapiAssistantId`); the browser only receives `assistantId`.
3. Live session on `MockInterviewSessionPage` — `vapi.start(assistantId)` with the public web token (system prompt never in the client).
4. Optional voice (`voiceAnalysisRoutes`) and video (`videoAnalysisRoutes`) metrics.
5. Submit transcript → Groq report with delimited untrusted text, score clamping, optional `flaggedForReview`.
6. Session / report data in MongoDB (`MockInterviewSession`, `InterviewReport`).

**Architecture diagram + trust boundaries:** `docs/interview-prep-architecture.md`

**Key areas:**
- Backend: `mockInterviewRoutes.js`, `vapiAssistantService.js`, `skillQuizRoutes.js`, `voiceAnalysisRoutes.js`, `videoAnalysisRoutes.js`
- Frontend: `frontend/src/pages/InterviewPrep/*`, `features/interviewPrep/**`

---

## 6. Where JSON is used

| Feature | JSON role |
|---------|-----------|
| Resume Builder | AI extracts resume → `ParsedResume.parsedData` |
| Resume Scanner | `structuredResume` is edit/preview source of truth; AI returns analysis JSON (skills, suggestions, scores) |
| Quizzes / interviews | AI returns quiz/report JSON payloads |

Flat ATS text in the Scanner is **generated** from structured JSON (`generateAtsText`), not the primary thing users edit as one blob.

---

## 7. Feature comparison (Builder vs Scanner)

| | Resume Builder Parser | Resume Scanner |
|--|----------------------|----------------|
| Goal | Turn CV into editable structured form / templates | Match CV to JD for ATS score & improvements |
| AI prompt | `resumeParser/aiParser.js` | `resumeScannerPrompts.js` |
| DB model | `ParsedResume` | `AtsAnalysis` (+ `ScannedResume`, `JobDescription`) |
| Edit model | `parsedData` fields | `structuredResume` field paths |
| Extra service | Optional file extract in Node | Python extract + ATS normalizer |

---

## 8. Typical user journeys

1. **Build a resume:** Register → Upload CV → AI parse → Edit in Resume Builder → Save / history.  
2. **Optimize for a job:** Upload CV + JD in Resume Scanner → Review scores/suggestions → Edit ATS fields → Preview → Accept suggestions.  
3. **Practice interview:** Interview Prep → Skill quiz and/or Mock interview session → Review feedback.

---

*Generated for the AI CareerBridge FYP codebase. Update this file when major feature flows change.*
