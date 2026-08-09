# Interview Prep — Architecture & Trust Boundaries

**Module:** Skill Assessment + AI Mock Interview (live)  
**Stack:** React / Express / MongoDB / Groq / Vapi  
**Last updated:** after Interview Prep hardening (server-side Vapi assistants, report sanitization, Groq retries)

---

## End-to-end live interview flow

```mermaid
sequenceDiagram
  autonumber
  actor User
  participant FE as Frontend<br/>(React + Vapi Web SDK)
  participant API as Backend<br/>(Express)
  participant DB as MongoDB
  participant Vapi as Vapi API<br/>(private key)
  participant Groq as Groq<br/>(LLM / Whisper)

  Note over User,Groq: Setup
  User->>FE: Configure role, resume, mode, persona
  FE->>API: POST /api/interview/live/start
  API->>Groq: generateOpeningQuestion (retry + fallback)
  Groq-->>API: opening question text
  API->>DB: create MockInterviewSession
  API->>Vapi: POST /assistant (system prompt baked in)
  Vapi-->>API: assistantId
  API->>DB: store session.vapiAssistantId
  API-->>FE: { sessionId, assistantId, … } (no system prompt)

  Note over User,Groq: Live call
  FE->>FE: vapi.start(assistantId) with public web token only
  FE<<->>Vapi: Real-time audio (Deepgram / OpenAI via Vapi)
  FE->>FE: Optional face-api video metrics (client-local)

  Note over User,Groq: Submission & report
  FE->>API: POST /api/interview/live/submit (transcript + metrics)
  API->>API: Cap transcript length; voice/video aggregate
  API->>DB: update session status + transcript
  API->>API: build snapshot; flag injection heuristics
  API->>Groq: report JSON (delimited CANDIDATE_TRANSCRIPT)
  Groq-->>API: scores + feedback
  API->>API: clamp scores 0–100; sanitize lists
  API->>DB: InterviewReport (+ flaggedForReview)
  API-->>FE: serialized report
  FE->>User: LiveInterviewReportView
```

---

## Skill assessment flow (summary)

1. `POST` skill-quiz generate → Groq MCQs → `SkillQuiz`  
2. User answers → server-side scoring (`skillQuizScoring` — not LLM)  
3. Results / weak areas returned to UI  

---

## Trust boundaries

| Concern | Browser controls? | Server validates / owns |
|--------|-------------------|-------------------------|
| Interviewer **system prompt** | **No** — never shipped | Built in `vapiAssistantService` from Mongo session fields |
| Vapi **private** API key | **No** | `VAPI_PRIVATE_KEY` env only |
| Vapi **public** web token | Yes (`VITE_VAPI_WEB_TOKEN`) | Only for joining the call |
| Opening question / persona / focus | Not needed on client for call start | Stored on session; baked into assistant |
| Transcript / QA text | Candidate content (untrusted) | Delimited in Groq prompt; injection heuristic → `flaggedForReview` |
| Report scores | Display only | Clamped 0–100 + Mongoose `min`/`max` |
| Audio for Whisper | May send `durationMs` | Rejected if `> MAX_VOICE_AUDIO_DURATION_MS` **before** Whisper |
| Skill quiz final score | Display only | Pure server scoring from stored correctIndex |

### Known limitations (document for FYP)

- Prompt-injection mitigations (delimiters + heuristics) **reduce** risk; they do not make LLM grading immune to adversarial transcripts.  
- `flaggedForReview` is an audit signal for instructors/admins, not an automatic fail.  
- Client-reported `durationMs` can under-report; Whisper `verbose_json` duration is checked after transcription when available.

---

## Key files

| Area | Path |
|------|------|
| Live start / submit | `backend/src/controllers/mockInterviewController.js` |
| Vapi assistant create | `backend/src/utils/vapiAssistantService.js` |
| Report + injection flag | `backend/src/utils/mockInterviewReportBuilder.js` |
| Groq report prompt | `backend/src/utils/mockInterviewReportGroqService.js` |
| Score clamp | `backend/src/utils/interviewScoreUtils.js` |
| Groq retry | `backend/src/utils/withGroqRetry.js` |
| FE call start | `frontend/src/features/interviewPrep/components/LiveInterviewAgent.jsx` |
| FE setup | `frontend/src/features/interviewPrep/components/MockInterviewSetup.jsx` |

---

## Modes

Selectable in UI: `video_voice`, `voice_only`.  
`text_only` remains in the backend enum for forward compatibility but is **not** offered in the UI until a full text Q&A path exists.
