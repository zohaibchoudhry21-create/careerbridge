# Interview System Optimizations

Production-grade performance and reliability work for the mock / live interview path.  
**No UI redesign, no intentional business-logic changes, APIs remain backward compatible.**

## Goals addressed

| Goal | Approach |
|------|----------|
| Reduce AI latency | Parallel `Promise.all` for voice + speech analysis on submit |
| Reduce duplicate Groq calls | Idempotent submit/report cache; TTL cache for role suggestions & resume analysis |
| Improve response time | Skip redundant session GET when `assistantId` is in nav state; lean history queries |
| Parallelize independent analysis | Voice Groq and speech monitoring run concurrently |
| Improve caching | Report cache by `reportId` / unique `(sourceType, sourceId)`; in-process TTL caches |
| Improve DB queries / indexes | Compound history index; session indexes; projected `.select()` on history |
| Reduce payload size | Acoustic stride on FE; cap arrays; strip acoustics after analysis; live session omits large PII blobs; snapshot QA no longer duplicates full transcript |
| Frontend loading | Lazy agent unchanged; skip session fetch with nav assistant; history invalidation + staleTime |
| API consistency | Additive `cached` flags; same success envelopes via `sendResponse` |
| Error handling | Speech analysis non-fatal; duplicate-key race returns cached report |
| Logging | Structured `[interview-perf]` stage timing (`interviewPerfLog`) |
| Security | Cap monitoring arrays; live GET hides questions + resume/JD text |
| Scalability | Smaller Mongo documents; idempotent submit; best-effort in-process caches |

## Major changes

### Submit pipeline (`submitLiveInterview`)

1. Early return if session already `completed` with a report (no second Groq pass).
2. Cap `acousticSamples` / `pauseEvents` server-side (aligned with validators).
3. Run voice analysis and speech monitoring in parallel.
4. Persist compact metrics (no raw acoustic series; timeline caps).
5. Then generate/persist report with stage timing logs.

### Report service

- Unique-index race (`11000`) → load existing report and return `cached: true`.
- Live snapshot: empty per-question `transcript`; full conversation only on `fullTranscript`.
- Trim `rawMetricsSnapshot` (timeline/transcript caps; omit live audio hints & context brief).

### Database

- `InterviewReport`: `{ userId: 1, sourceType: 1, createdAt: -1 }`
- `MockInterviewSession`: `{ userId: 1, mode: 1, createdAt: -1 }`, sparse `{ reportId: 1 }`

Indexes are created by Mongoose on app boot (`syncIndexes` / ensureIndexes behavior of the driver). No migration script required for new indexes.

### Frontend

- `prepareLiveAudioHintsForSubmit` downsamples acoustics (stride, default 2) before submit.
- Session page skips `GET /session` when `location.state.assistantId` is present.
- Submit/report success invalidates `interview-report-history`.

### Config (env)

See `backend/.env.example` under “Interview performance / payload / cache”.

## Non-goals / explicit non-changes

- Scoring formulas and report section semantics unchanged.
- Vapi live call flow unchanged (still one server-created assistant).
- Legacy report shape preserved; `enterpriseReport` still optional for old rows.
- No UI redesign.

## Rollback

1. Revert the listed files in git.
2. New indexes are additive and safe to leave; drop manually if desired:
   - `InterviewReport`: `userId_1_sourceType_1_createdAt_-1`
   - `MockInterviewSession`: `userId_1_mode_1_createdAt_-1`, `reportId_1`
3. Disable perf logs: `INTERVIEW_PERF_LOG_ENABLED=false`.
4. FE stride: `VITE_INTERVIEW_ACOUSTIC_STRIDE=1`.
