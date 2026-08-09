# Resume Scanner — Phase 3 UX/UI Spec

## Score header (`DualScoreHeader`)

Replace the single `AtsScoreGauge` in the sidebar with two side-by-side score cards:

| Card | Data binding | Breakdown tooltip |
|------|--------------|-------------------|
| ATS Score | `analysis.atsScore` | `sectionCompleteness`, `searchability`, `quantifiedAchievements` |
| Job Match Score | `analysis.jobMatchScore` | `keywordCoverage`, `aiAssessedRelevance` |

- Animate ring/number on change (reuse `AtsScoreGauge` internally ×2).
- Delta chip (`+3`, `-1`) next to each score when value changes after accept/reject/undo/redo.
- React Query mutation `onSuccess` already refreshes analysis — no extra polling.

## Toolbar (`SuggestionToolbar`)

**Keep:** Accept/Reject, Accept All, Undo, Redo, Edit/Preview toggle, New Analysis link, Continue.

**Change:** Progress bar shows suggestion completion (`accepted / total`), not `jobMatchScore`.

**Continue:** Sets `activeStep = 2` on the same page (`suggestionsEnabled = false`). Does **not** navigate to Resume Builder — data models differ (`AtsAnalysis.structuredResume` vs `ParsedResume.parsedData`). In-page edit mode is enhanced to match Resume Builder section editing.

## Unappliable suggestions

When backend sets `status: 'unappliable'` with `applyError`:

- Show amber badge on the field line or in popover.
- CTA: "Edit manually" — focus the field in `ResumeEditor`.
- Do not show Accept (or disable with tooltip).

## Live preview

- `StructuredResumeView` reads `structuredSections` from analysis cache after each save.
- Debounce: 700ms in `ResumeEditor` before PATCH.
- Show `isSaving` indicator on toolbar when mutation pending.
- Toast on save failure (already implemented).

## Component tree (analysis page)

```
ResumeScannerAnalysisPage
├── SkillsSidebar
│   └── DualScoreHeader (ats + job match)
├── SuggestionToolbar (suggestion progress bar)
└── ResumeEditor | StructuredResumeView
    └── SuggestionPopover (reason + unappliable state)
```

## Copy updates

- Sidebar header: distinguish "ATS Score" vs "Job Match Score" labels.
- Remove any copy that refers to a single blended "score" without qualifier.
