# Resume Scanner — Backend Architecture (Production)

**Status:** Phases 1–6 implemented  
**Last updated:** Phase 6 production hardening

---

## Final layered architecture

```text
Routes / Validators / Rate limits
        ↓
Thin Controller
        ↓
Resume Scanner Orchestrator
        ├─ JobService              (extract → analyze → decide once → optimize|rewrite)
        ├─ OptimizeService         (suggestions, text, undo/redo)
        ├─ RewriteLifecycleService (accept/reject rewrite)
        ├─ FinalizeService + PdfService
        ├─ StructureService
        └─ AnalysisPersistence
                ↓
Utils: aiService, pipeline/*, validation/*, structuredResume, history, serializer
                ↓
Models: AtsAnalysis, ScannedResume, JobDescription
```

---

## AI pipeline (current)

```text
Extract (0 LLM)
  → Structure (0 LLM)
  → Analyze (1 LLM, 90s timeout)
  → Decision Engine ONCE → DecisionContext
       ├─ optimize → suggestions
       └─ rewrite
            → Plan (0–1 LLM)
            → Rewrite (1 LLM, regen ≤3 with validation feedback)
            → Validation (facts, structure, ATS, quality, diff)
            → Preview scores via recompute (0 LLM)
  → Accept rewrite → optional Analyze for suggestions (1 LLM)
  → Finish → finalize snapshot → Download PDF (0 LLM)
```

Typical rewrite path: **~2–3 LLM calls** (preview analyze removed; decision not duplicated).

---

## Validation gates

Centralized in `resumeScannerPipeline/validation/`:

1. Facts  
2. Structure  
3. ATS  
4. Quality  
5. Diff  

Failed validation triggers rewrite regeneration (max 3). Soft-accept with warnings still possible on last attempt (surfaced in `rewriteNotes`).

---

## PDF rules

- `POST /resume-scanner/:id/finalize` snapshots `finalizedStructuredResume`  
- `GET /resume-scanner/:id/pdf` only when `finalizedAt` + snapshot present  
- Never from suggestions, analysis scores, or unaccepted rewrite  

---

## Phase 6 hardening applied

- Removed dead `resumeScannerRewritePrompts.js` and unused services barrel  
- Shared Jaccard/tokenize metrics (similarity ↔ validation)  
- Shared `resumeScannerJson.parseModelJson` (analyze + pipeline; no analyze→pipeline import)  
- 90s LLM timeouts on analyze + pipeline clients  
- Stopped persisting duplicate extract `rawText` in metadata  
- Soft-accept validation warnings appended to `rewriteNotes`  
- Duplicate background job runs logged  
- Status polling uses lean field projection (no history/suggestions load)  
- Upload overlay navigates on status completion (analysis prefetch non-blocking)  
- Removed dead exports (`factsContainToken`, `runDecisionPipeline` alias)  

---

## Remaining technical debt (deferred)

| Item | Why deferred |
|------|----------------|
| Soft-accept → hard-fail | Product/UX behavior change |
| Unify analyze + pipeline LLM client fully | Retry/temp parity risk |
| Prefer Python structured_sections | Quality gate needed |
| Drop accept-path Analyze LLM | Suggestion quality tradeoff |
| Align prompt scoreBreakdown with deterministic scores | Prompt/schema change |
| Job lease / stuck-job reclaim / multi-instance lock | Infra |
| Full job wall-clock timeout | Infra |
| History snapshot size reduction | Undo fidelity tradeoff |
| Slim unused API response fields / coverLetter | Contract change |
| Cover letter generation | Product feature |
| FE/BE shared structured-resume package | Larger refactor |

---

## Key entrypoints

| Concern | Path |
|---------|------|
| Routes | `backend/src/routes/resumeScannerRoutes.js` |
| Controller | `backend/src/controllers/resumeScannerController.js` |
| Orchestrator | `backend/src/services/resumeScanner/resumeScannerOrchestrator.js` |
| Job pipeline | `backend/src/services/resumeScanner/jobService.js` |
| Decision / rewrite | `backend/src/utils/resumeScannerPipeline/` |
| Validation | `backend/src/utils/resumeScannerPipeline/validation/` |
| PDF | `backend/src/services/resumeScanner/pdfService.js` |
| FE workflow | `frontend/src/features/resumeScanner/utils/workflowPhases.js` |
