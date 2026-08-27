# Resume Scanner — How It Works (A to Z)

**Module:** Resume Scanner  
**Audience:** Product, demos, and anyone who needs the full feature story without digging into code  
**Scope:** End-to-end working — what the user does, what the system does, scores, AI vs rules, outcomes, and how it ties to the rest of the product  

This guide intentionally **does not** include source code, file paths, or API route lists.

---

## 1. What Resume Scanner is

Resume Scanner is a **job-description–tied resume optimization workspace**.

A logged-in user uploads their resume, pastes a target job description, and gets:

- How **ATS-friendly** the resume looks  
- How well it **matches that specific job**  
- Concrete **suggestions** (or a full **rewrite**)  
- An in-app **improve → finalize → download PDF** flow  

**One-line goal:** *“For this job, show me how my resume will perform, help me fix the gaps, and leave with a finalized PDF.”*

**What it is not**

| Not this | Why |
|----------|-----|
| General Resume Builder | Builder is a separate create/edit product; Scanner is JD-matched optimization |
| Interview Prep | No direct handoff into mock/panel/skill quizzes |
| Cover-letter generator | Not shipped in the live flow |

---

## 2. Who can use it

- User must be **logged in**  
- Every analysis belongs to that user only  
- Rate limits protect heavy work (uploads / PDF) and fast interactions (accept, edit, undo) so one user cannot flood the service  

---

## 3. How the user gets in

Typical entry points:

- App navigation / sidebar (**Resume Scanner**)  
- Dashboard quick action (**Optimize resume**)  
- Dashboard Resume Scanner section (empty CTA or open after prior scans)  
- Career / job-match cards that deep-link into a **past analysis**  

There are two main screens:

1. **Upload / setup** — file + job description → start analysis  
2. **Analysis workspace** — scores, suggestions, editing, finalize, done  

---

## 4. End-to-end journey (happy path)

```
Setup → Processing → (Rewrite review if needed) → Improve → Finalize → Done
```

### Step A — Setup

1. Choose a resume file (**PDF** or **DOCX**, up to **10 MB**).  
2. Paste the full job description (required; long text supported, with an upper character limit).  
3. Press **Analyze**.

### Step B — Processing (background)

The upload returns quickly. Heavy work continues in the background while an overlay shows progress, roughly:

**Queued → Extracting → Analyzing → Complete** (or Failed)

When complete, the user lands in the analysis workspace.

### Step C — Rewrite review (only sometimes)

If the system decides the gap to the job is too large for small edits, it may propose a **full AI rewrite**.

Until the user **accepts** or **rejects** that rewrite:

- Improve / Finalize / PDF stay locked  
- Accept → work continues on the rewritten resume (suggestions may refresh)  
- Reject → keep the original path with incremental suggestions  

### Step D — Improve

- Dual scores at the top (**ATS** + **Job Match**)  
- Resume preview with **suggestion popovers**  
- Skills sidebar: matched vs missing  
- Accept / reject / accept all, undo / redo, manual edits  
- Progress bar = **suggestions accepted / total** (not the job-match number)

### Step E — Finalize

- Freer section-style editing (similar feel to a resume editor)  
- Template choice (classic, modern, minimal, professional, elegant, etc.)  
- Live preview  
- **Finish** creates a frozen snapshot used for PDF  

### Step F — Done

- Confirmation  
- **Download PDF** (only after finalize, and never while rewrite review is still pending)  
- Start a **new analysis**, or go back to tweak finalize  

---

## 5. What the user can input and change

| Input | Notes |
|--------|--------|
| Resume file | PDF or DOCX, max 10 MB |
| Job description | Pasted plain text, required |
| During Improve | Accept/reject suggestions, edit fields/sections, undo/redo |
| During Finalize | Section edits, template, preview; Finish locks snapshot |
| After Done | Download PDF; start new scan |

**Note:** Starting from a Resume Builder–built resume as the *upload source* is not the live production path today. Live uploads create a **scanned** resume for this analysis.

---

## 6. What the system does behind the scenes

Upload creates a **pending analysis** and related records, then a background pipeline runs.

### Stage 1 — Extract (no AI)

- Prefer the specialized extraction service for text, sections, and layout hints  
- If that fails, fall back to a secondary extractor  
- Status moves to **extracting**

### Stage 2 — Structure (no AI)

- Normalize extracted content into a **structured resume** used for editing and scoring  

### Stage 3 — Analyze (AI)

- One analysis pass (primary AI provider, with a configured fallback)  
- Pulls JD skills, role signals, suggestions, tips, quality/relevance signals  
- Then **deterministic** skill matching and score blending  
- Status moves to **analyzing**, then **completed** when ready  

### Stage 4 — Decision (no AI)

A decision engine chooses:

| Mode | Meaning |
|------|---------|
| **Optimize** | Keep structure; apply incremental suggestions |
| **Rewrite** | Draft a full rewritten resume for review |

Signals include keyword coverage, job relevance, similarity / field mismatch, and overall job match — when JD skills could be extracted. If skills cannot be extracted, Job Match may be unavailable and rewrite is not forced the same way.

### Stage 5 — Branch

**Optimize:** attach suggestions; user goes to Improve.

**Rewrite:**

1. Plan (light / optional AI)  
2. Rewrite body (AI), with validation retries  
3. Rule-based gates (facts, structure, ATS quality, diff sanity)  
4. Deterministic **preview scores** (no second full analyze required)  
5. User must accept or reject before Improve unlocks  

### Stage 6 — Interactive loop (mostly rules)

Accepting/rejecting suggestions and editing text recalculates scores and skill lists. Undo/redo uses a history stack.

### Stage 7 — Finalize & PDF (no AI)

- Finish stores a **finalized snapshot**  
- PDF is rendered **only** from that snapshot — never from live unaccepted rewrite or raw live suggestion state  

---

## 7. Scores and insights the user sees

### Dual header scores

| Score | What it means | Rough breakdown |
|--------|----------------|-----------------|
| **ATS Score (0–100)** | How readable/structured the resume is for ATS-like systems | Section completeness, searchability, quantified achievements |
| **Job Match Score (0–100)** | Fit to *this* JD | Keyword coverage (dominant), AI relevance / quality blend |

If JD skills cannot be extracted, **Job Match** can show as unavailable with a clear warning.

### Sidebar / supporting panels

- **Skills** — matched vs missing; required vs hard; progress per skill where relevant  
- **Searchability** — completeness, searchability, quantified achievements, issue list  
- **Recruiter tips** — AI tips aimed at the role  

### Suggestion UX

- Each suggestion can show an **impact** hint  
- After accept / reject / undo / redo, score **delta chips** (e.g. +3 / −1) can appear  
- Suggestions that no longer apply cleanly become **unappliable** → user edits manually  

### Warnings (when relevant)

- Field / career mismatch vs the JD  
- Unclear JD requirements  
- Low extraction quality (scores may be less trustworthy)  

---

## 8. AI vs rules — who does what

| Concern | Approach |
|---------|----------|
| File text & section extraction | Rule / service extractors (primary + fallback) |
| Skill presence on resume (synonyms, acronyms, fuzzy match) | Deterministic matching |
| ATS score components | Deterministic formulas |
| Optimize vs rewrite decision | Deterministic decision engine |
| JD skill list, title/company cues, suggestions, tips, relevance signals | AI analysis pass |
| Full rewrite planning & body | AI, with rule-based validation retries |
| Preview scores after rewrite | Deterministic recompute |
| Apply suggestion, undo history, finalize, PDF | Deterministic |

If no AI provider is configured or both fail, analysis fails with a clear “service unavailable” style outcome. Analysis calls use timeouts on the order of about **90 seconds**; the overlay can show that things are taking longer than expected.

---

## 9. What gets saved (conceptually)

| Record | Role |
|--------|------|
| **Scanned resume** | File metadata, extracted text, sections, extraction quality hints |
| **Job description** | Raw JD text, inferred title/company, extracted skills (with types/synonyms) |
| **ATS analysis (session)** | Status/progress, dual scores & breakdowns, matched/missing skills, working structured resume, template, suggestions, tips/issues, optimize vs rewrite state, rewrite drafts/notes, decision snapshot, undo history, finalized snapshot + time, errors |

Analyses are listed by user and recency. Concurrent edits are protected so two overlapping saves do not silently clobber each other.

---

## 10. Statuses and important edge cases

### Job / analysis status

`pending` → `extracting` → `analyzing` → **`completed`** or **`failed`**

The UI polls/progresses until complete or failed.

### Rewrite state

| State | Effect |
|--------|--------|
| Optimize, rewrite none | Normal Improve |
| Rewrite pending review | Gate locked until accept/reject |
| Rewrite accepted | Continue Improve on rewritten content |
| Rewrite rejected | Stay on original + optimize-style suggestions |

### When rewrite is more likely

Roughly when JD skills exist and signals look poor — e.g. extreme field mismatch, very low keyword coverage, low job relevance, or low overall job match (plus similarity / domain cues). Exact thresholds live in the decision engine and can be tuned.

### Suggestion statuses

`pending` · `accepted` · `rejected` · `unappliable`

Unappliable: Accept disabled; user edits manually.

### PDF rules (hard)

- Only after **Finish / finalize**  
- Only from the **finalized snapshot**  
- Not while rewrite review is still pending  
- Not from live suggestion state alone  

### Soft-accept rewrite

If validation keeps failing after max retries, a rewrite may still be offered with warnings in rewrite notes rather than blocking forever.

---

## 11. Errors the user may hit

| Situation | Typical outcome |
|-----------|-----------------|
| Missing / oversized / wrong file type | Blocked at upload |
| Empty or too-long JD | Validation error |
| Extraction failure / empty resume text | Analysis fails with message |
| AI not configured / bad AI response / timeout | Failed or “taking longer” overlay |
| Acting before analysis is ready | Conflict / not ready |
| Rate limit exceeded | Too many requests; retry later |
| Finalize / PDF before snapshot | Download blocked until Finish |
| Concurrent edit conflict | Retried or surfaced as conflict |

---

## 12. How Resume Scanner connects to the rest of the product

| Area | Connection |
|------|------------|
| **Dashboard** | Latest **completed** scan feeds profile strength, resume intelligence (gaps/insights), career risk from missing skills, scan counts / ATS trend, and job-match deep links |
| **Resume Builder** | Parallel product. Finalize *feels* like section editing, but the user stays inside Scanner — data models stay separate; no automatic “open in Builder” |
| **Interview Prep** | Same career dashboard ecosystem, but **no direct data pipeline** from a scan into mock/panel/skill sessions |
| **Marketing / home** | Positions Scanner as ATS + keyword optimization next to Builder |

---

## 13. A-to-Z checklist (mental model)

1. User authenticates and opens Resume Scanner.  
2. Uploads PDF/DOCX + pastes JD → Analyze.  
3. System creates pending analysis; background extract → structure → AI analyze → decision.  
4. Either **optimize** (suggestions) or **rewrite** (review gate).  
5. User improves scores via accept/reject/edit; undo/redo available.  
6. User continues to Finalize, edits sections/template, presses Finish.  
7. Done: download ATS-oriented PDF; optional new analysis.  
8. Dashboard reflects the latest completed scan for career progress and insights.  

---

## 14. Quick FAQ

**Q: Why two scores?**  
ATS = machine readability / structure. Job Match = fit to *this* pasted JD.

**Q: Why can’t I download PDF right after Analyze?**  
PDF is a finished artifact. It must come from a **finalized snapshot** after Finish, so suggestions and rewrite review do not produce half-baked downloads.

**Q: Why a full rewrite sometimes?**  
When small keyword edits cannot close a large field/fit gap, the system offers a rewritten draft for review instead of flooding the user with weak suggestions.

**Q: Does accepting all suggestions guarantee a high Job Match?**  
No. Suggestions help, but JD clarity, extraction quality, and true experience still matter. Progress ≠ Job Match score.

**Q: Does this replace Resume Builder?**  
No. Builder creates/edits resumes generally. Scanner optimizes a resume **against a job**.

---

*Last focused on product working behavior for demos and handoff. For implementation detail (pipelines, schemas, UX component contracts), see the separate Resume Scanner architecture and UX specs in the docs folder.*
