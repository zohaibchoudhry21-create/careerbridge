# Resume Scanner — Full Code Dump (Frontend + Backend + Python)

Generated: 2026-08-04T18:00:00.515Z

## Index

1. `frontend/src/pages/ResumeScanner/ResumeScannerUploadPage.jsx`
2. `frontend/src/pages/ResumeScanner/ResumeScannerAnalysisPage.jsx`
3. `frontend/src/features/resumeScanner/components/ResumeUploadPanel.jsx`
4. `frontend/src/features/resumeScanner/components/JobDescriptionPanel.jsx`
5. `frontend/src/features/resumeScanner/components/AnalyzeOverlay.jsx`
6. `frontend/src/features/resumeScanner/components/ResumeEditor.jsx`
7. `frontend/src/features/resumeScanner/components/StructuredResumeView.jsx`
8. `frontend/src/features/resumeScanner/components/SkillsSidebar.jsx`
9. `frontend/src/features/resumeScanner/components/AtsScoreGauge.jsx`
10. `frontend/src/features/resumeScanner/components/SuggestionToolbar.jsx`
11. `frontend/src/features/resumeScanner/components/SuggestionPopover.jsx`
12. `frontend/src/features/resumeScanner/hooks/useResumeScanner.js`
13. `frontend/src/features/resumeScanner/services/resumeScannerService.js`
14. `frontend/src/features/resumeScanner/utils/resumeEditorUtils.js`
15. `frontend/src/features/resumeScanner/utils/structuredResumeUtils.js`
16. `frontend/src/i18n/locales/en/resumeScanner.json`
17. `frontend/src/i18n/locales/es/resumeScanner.json`
18. `frontend/src/i18n/locales/ur/resumeScanner.json`
19. `frontend/src/App.jsx`
20. `backend/src/routes/resumeScannerRoutes.js`
21. `backend/src/controllers/resumeScannerController.js`
22. `backend/src/middleware/resumeScannerUploadMiddleware.js`
23. `backend/src/middleware/resumeScannerRateLimiters.js`
24. `backend/src/validators/resumeScannerValidators.js`
25. `backend/src/models/AtsAnalysis.js`
26. `backend/src/models/ScannedResume.js`
27. `backend/src/models/JobDescription.js`
28. `backend/src/utils/structuredResume.js`
29. `backend/src/utils/resumeScannerExtractionService.js`
30. `backend/src/utils/resumeScannerAiService.js`
31. `backend/src/utils/resumeScannerGroqService.js`
32. `backend/src/utils/resumeScannerClaudeService.js`
33. `backend/src/utils/resumeScannerPrompts.js`
34. `backend/src/utils/resumeScannerSchemas.js`
35. `backend/src/utils/resumeScannerScoring.js`
36. `backend/src/utils/resumeScannerTextUtils.js`
37. `backend/src/utils/resumeScannerHistory.js`
38. `backend/src/utils/resumeScannerSerializer.js`
39. `backend/src/utils/resumeScannerStructuredSections.js`
40. `backend/src/utils/resumeLineMapUtils.js`
41. `backend/src/utils/pythonExtractorService.js`
42. `backend/src/utils/resumeFileExtractor.js`
43. `backend/src/app.js`
44. `python-service/main.py`
45. `python-service/extractor.py`
46. `python-service/ats_normalizer.py`
47. `python-service/resume_extractor.py`
48. `python-service/cleaner.py`
49. `python-service/chunker.py`
50. `python-service/platform_config.py`
51. `python-service/requirements.txt`
52. `python-service/.env.example`

---

## 1. FRONTEND — Pages

### FILE: `frontend/src/pages/ResumeScanner/ResumeScannerUploadPage.jsx`

```jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  UploadCloud,
  FileText,
  X,
  ClipboardPaste,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';
import { resolveApiError } from '../../utils/apiError';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import AnalyzeOverlay from '../../features/resumeScanner/components/AnalyzeOverlay';
import Skeleton from '../../components/Skeleton';
import { cn } from '../../lib/utils';
import {
  useResumeScannerAnalysis,
  useResumeScannerStatus,
  useUploadResumeScanner,
} from '../../features/resumeScanner/hooks/useResumeScanner';

const ACCEPTED_TYPES = ['.pdf', '.docx'];
const MAX_MB = 10;

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function StepBadge({ n, active, done }) {
  return (
    <div
      className={cn(
        'relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-all duration-300',
        done
          ? 'bg-green-600 text-white shadow-[0_2px_10px_rgba(22,163,74,0.28)]'
          : active
            ? 'bg-secondary text-on-secondary shadow-[0_2px_10px_rgba(0,88,190,0.28)]'
            : 'bg-surface-container-high text-outline'
      )}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : n}
      {active && !done && (
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-secondary/30" />
      )}
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-outline-variant/40 bg-surface-container px-2.5 py-1 text-[12px] font-medium leading-none text-on-surface-variant">
      {children}
    </span>
  );
}

function FileUploadSkeleton() {
  return (
    <div className="flex min-h-[340px] flex-col gap-4" aria-busy="true">
      <Skeleton type="list" count={1} label="Processing resume" />
      <div className="flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low py-10 px-6">
        <Skeleton type="avatar" size="lg" withMeta={false} />
        <div className="mt-4 w-full max-w-[220px]">
          <Skeleton type="text" lines={3} />
        </div>
      </div>
    </div>
  );
}

export default function ResumeScannerUploadPage() {
  const { t } = useTranslation('resumeScanner');
  const { user } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const fileLoadTimerRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [activeAnalysisId, setActiveAnalysisId] = useState(null);
  const [overlayOpen, setOverlayOpen] = useState(false);

  const uploadMutation = useUploadResumeScanner();
  const { data: statusData } = useResumeScannerStatus(activeAnalysisId, overlayOpen);
  const { data: analysisData } = useResumeScannerAnalysis(
    activeAnalysisId,
    overlayOpen && statusData?.status === 'completed'
  );

  const isAnalyzing = uploadMutation.isPending || overlayOpen;
  const step1Done = !!selectedFile && !isFileLoading;
  const step2Done = jobDescription.trim().length > 0;
  const progressPct = step1Done && step2Done ? 100 : step1Done || step2Done ? 50 : 0;
  const canAnalyze = step1Done && step2Done && !isAnalyzing && !fileError;

  useEffect(() => {
    return () => {
      if (fileLoadTimerRef.current) {
        clearTimeout(fileLoadTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!overlayOpen || !statusData) return;

    if (statusData.status === 'failed') {
      setOverlayOpen(false);
      setActiveAnalysisId(null);
      toast.error(statusData.errorMessage || t('overlay.failed'));
    }
  }, [overlayOpen, statusData, t]);

  useEffect(() => {
    if (!overlayOpen || statusData?.status !== 'completed' || !analysisData) return;

    const timer = setTimeout(() => {
      setOverlayOpen(false);
      navigate(`/resume-scanner/${activeAnalysisId}`);
      setActiveAnalysisId(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [overlayOpen, statusData?.status, analysisData, activeAnalysisId, navigate]);

  const validateAndSetFile = useCallback(
    (file) => {
      if (!file) return;
      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!ACCEPTED_TYPES.includes(ext)) {
        if (fileLoadTimerRef.current) clearTimeout(fileLoadTimerRef.current);
        setIsFileLoading(false);
        setSelectedFile(null);
        setFileError(t('upload.errors.unsupportedFile'));
        toast.error(t('upload.errors.unsupportedFile'));
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        if (fileLoadTimerRef.current) clearTimeout(fileLoadTimerRef.current);
        setIsFileLoading(false);
        setSelectedFile(null);
        setFileError(t('upload.errors.fileTooLarge'));
        toast.error(t('upload.errors.fileTooLarge'));
        return;
      }
      setFileError('');
      setSelectedFile(file);
      setIsFileLoading(true);
      if (fileLoadTimerRef.current) clearTimeout(fileLoadTimerRef.current);
      fileLoadTimerRef.current = setTimeout(() => {
        setIsFileLoading(false);
        fileLoadTimerRef.current = null;
      }, 1100);
    },
    [t]
  );

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      validateAndSetFile(event.dataTransfer.files?.[0]);
    },
    [validateAndSetFile]
  );

  const onBrowse = (event) => {
    validateAndSetFile(event.target.files?.[0]);
  };

  const removeFile = () => {
    if (fileLoadTimerRef.current) clearTimeout(fileLoadTimerRef.current);
    setIsFileLoading(false);
    setSelectedFile(null);
    setFileError('');
    if (inputRef.current) inputRef.current.value = '';
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setJobDescription(text);
        toast.success(t('upload.pasteHint'));
      }
    } catch {
      toast.error(t('upload.errors.jobDescriptionRequired'));
    }
  };

  const handleAnalyze = async () => {
    const trimmedJobDescription = jobDescription.trim();

    if (!trimmedJobDescription) {
      toast.error(t('upload.errors.jobDescriptionRequired'));
      return;
    }

    if (!selectedFile) {
      toast.error(t('upload.errors.fileRequired'));
      return;
    }

    if (fileError) {
      toast.error(fileError);
      return;
    }

    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        jobDescription: trimmedJobDescription,
      });

      setActiveAnalysisId(result.analysisId);
      setOverlayOpen(true);
    } catch (error) {
      toast.error(resolveApiError(error, t('upload.errors.analyzeFailed')));
    }
  };

  const matchedSkills =
    analysisData?.matchedSkills?.length > 0
      ? analysisData.matchedSkills
      : analysisData?.skills?.filter((skill) => skill.matched) || [];

  return (
    <DashboardLayout user={user}>
      <PageContainer>
        <PageHeader title={t('page.upload.title')} description={t('page.upload.description')} />

        <style>{`
          @keyframes rsFadeInUp { from { opacity:0; transform:translateY(8px);} to {opacity:1; transform:translateY(0);} }
          .rs-fade-in-up { animation: rsFadeInUp .45s cubic-bezier(.4,0,.2,1) both; }
        `}</style>

        {/* progress rail */}
        <div className="mb-md flex items-center gap-3 px-1">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-outline-variant/40">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            {progressPct}% ready
          </span>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-md sm:grid-cols-2">
          {/* Step 1 — Resume upload */}
          <section className="dashboard-glass-card group flex h-full flex-col rounded-2xl p-md sm:p-lg">
            <div className="mb-md flex items-center gap-3">
              <StepBadge n={1} active={!step1Done} done={step1Done} />
              <h2 className="font-headline-md text-headline-md text-primary">
                {t('upload.step1Title')}
              </h2>
            </div>

            {!selectedFile ? (
              <label
                htmlFor="resume-upload"
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={cn(
                  'flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300',
                  isDragging
                    ? 'scale-[1.01] border-secondary bg-secondary/5'
                    : 'border-outline-variant bg-surface-container-low hover:border-secondary/50 hover:bg-secondary/5'
                )}
              >
                <input
                  ref={inputRef}
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.docx"
                  className="sr-only"
                  onChange={onBrowse}
                />
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-container-highest text-secondary transition-transform duration-300 group-hover:scale-105">
                  <UploadCloud className="h-7 w-7" strokeWidth={1.75} />
                </div>
                <p className="font-headline-md text-headline-md text-primary">
                  {t('upload.dropzoneTitle')}
                </p>
                <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
                  {t('upload.dropzoneHint')}
                </p>
                <div className="mt-5 flex items-center gap-2">
                  <Chip>{t('upload.formats.pdf')}</Chip>
                  <Chip>{t('upload.formats.docx')}</Chip>
                  <Chip>{t('upload.formats.maxSize')}</Chip>
                </div>
              </label>
            ) : isFileLoading ? (
              <FileUploadSkeleton />
            ) : (
              <div className="flex min-h-[340px] flex-col">
                <div className="rs-fade-in-up flex items-start justify-between rounded-xl border border-outline-variant/40 bg-surface-container-low p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-label-md text-label-md text-primary">
                        {selectedFile.name}
                      </p>
                      <p className="font-label-sm text-label-sm text-on-surface-variant">
                        {formatBytes(selectedFile.size)} · Ready to analyze
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    aria-label="Remove file"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-outline transition-colors hover:bg-error/10 hover:text-error"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-4 flex flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-outline-variant/40 bg-surface-container-low py-10 text-center">
                  <ShieldCheck className="mb-3 h-6 w-6 text-amber-600" strokeWidth={2} />
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    File received securely
                  </p>
                  <label
                    htmlFor="resume-upload-replace"
                    className="mt-3 cursor-pointer font-label-md text-label-md font-semibold text-secondary hover:text-secondary-container"
                  >
                    {t('upload.changeFile')}
                    <input
                      id="resume-upload-replace"
                      type="file"
                      accept=".pdf,.docx"
                      className="sr-only"
                      onChange={onBrowse}
                    />
                  </label>
                </div>
              </div>
            )}

            {fileError && (
              <div className="rs-fade-in-up mt-3 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3.5 py-2.5 font-label-sm text-label-sm font-medium text-error">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {fileError}
              </div>
            )}
          </section>

          {/* Step 2 — Job description */}
          <section className="dashboard-glass-card relative flex h-full flex-col overflow-hidden rounded-2xl p-md sm:p-lg">
            <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-secondary via-secondary-container to-secondary opacity-50" />

            <div className="mb-md flex items-center justify-between gap-sm">
              <div className="flex items-center gap-3">
                <StepBadge n={2} active={!step2Done} done={step2Done} />
                <h2 className="font-headline-md text-headline-md text-primary">
                  {t('upload.step2Title')}
                </h2>
              </div>
              {jobDescription && (
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="font-label-sm text-label-sm text-secondary hover:underline"
                >
                  {t('upload.clearText')}
                </button>
              )}
            </div>

            <div className="relative flex-1">
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder={t('upload.jobDescriptionPlaceholder')}
                className="h-full min-h-[300px] w-full resize-none rounded-xl border border-outline-variant/40 bg-surface-container-low p-4 font-body-md text-body-md text-on-surface shadow-inner outline-none transition-colors placeholder:text-outline/70 focus:border-secondary/40 focus:bg-surface-container-lowest focus:ring-2 focus:ring-secondary/50"
              />
              <button
                type="button"
                onClick={pasteFromClipboard}
                className="absolute bottom-3 end-3 flex items-center gap-1.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest/90 px-3 py-1.5 font-label-sm text-label-sm text-on-surface-variant shadow-sm backdrop-blur transition-all hover:border-secondary/40 hover:text-secondary"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                {t('upload.pasteHint')}
              </button>
            </div>

            <div className="mt-2 flex justify-end">
              <span className="font-label-sm text-label-sm text-on-surface-variant">
                {jobDescription.length.toLocaleString()} characters
              </span>
            </div>

            <div className="mt-md flex flex-col-reverse items-center justify-between gap-4 border-t border-outline-variant/30 pt-md sm:flex-row">
              <p className="flex items-center gap-1.5 font-label-sm text-label-sm text-on-surface-variant">
                <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
                {t('upload.poweredBy')}
              </p>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className={cn(
                  'inline-flex items-center justify-center font-label-md transition-all disabled:cursor-not-allowed disabled:opacity-55',
                  'w-full gap-2 px-lg py-3 rounded-2xl sm:w-auto',
                  'bg-gradient-to-r from-indigo-600 to-blue-600 text-white',
                  'shadow-[0_4px_14px_rgba(79,70,229,0.32)]',
                  'hover:from-indigo-500 hover:to-blue-500',
                  canAnalyze && 'hover:-translate-y-0.5 active:translate-y-0'
                )}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {t('upload.analyze')}
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </PageContainer>

      <AnalyzeOverlay
        open={overlayOpen}
        progress={statusData?.progress ?? 5}
        status={statusData?.status ?? 'pending'}
        statusMessage={statusData?.statusMessage}
        extractedSkills={matchedSkills}
      />
    </DashboardLayout>
  );
}

```

### FILE: `frontend/src/pages/ResumeScanner/ResumeScannerAnalysisPage.jsx`

```jsx
import { useCallback, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';
import ResumeEditor from '../../features/resumeScanner/components/ResumeEditor';
import StructuredResumeView from '../../features/resumeScanner/components/StructuredResumeView';
import SkillsSidebar from '../../features/resumeScanner/components/SkillsSidebar';
import SuggestionToolbar from '../../features/resumeScanner/components/SuggestionToolbar';
import {
  useAcceptAllSuggestions,
  useRedoResumeScannerChange,
  useResumeScannerAnalysis,
  useUndoResumeScannerChange,
  useUpdateResumeScannerText,
  useUpdateSuggestionStatus,
} from '../../features/resumeScanner/hooks/useResumeScanner';
import { resolveApiError } from '../../utils/apiError';
import { cn } from '../../lib/utils';
import Skeleton from '../../components/Skeleton';
import {
  hasStructuredResumeData,
  structuredResumeToSections,
} from '../../features/resumeScanner/utils/structuredResumeUtils';

const WORKSPACE_TABS = ['resume', 'coverLetter', 'jobDescription'];

export default function ResumeScannerAnalysisPage() {
  const { analysisId } = useParams();
  const { t } = useTranslation('resumeScanner');
  const { user } = useAuth();
  const { data: analysis, isLoading, isError, error } = useResumeScannerAnalysis(analysisId, true);

  const suggestionMutation = useUpdateSuggestionStatus(analysisId);
  const acceptAllMutation = useAcceptAllSuggestions(analysisId);
  const textMutation = useUpdateResumeScannerText(analysisId);
  const undoMutation = useUndoResumeScannerChange(analysisId);
  const redoMutation = useRedoResumeScannerChange(analysisId);

  const editorRef = useRef(null);
  const [isSavingText, setIsSavingText] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [workspaceTab, setWorkspaceTab] = useState('resume');
  const [viewMode, setViewMode] = useState('edit'); // 'edit' | 'preview'

  const handleSuggestionAction = useCallback(
    async (suggestion, action) => {
      try {
        await suggestionMutation.mutateAsync({ suggestionId: suggestion.id, action });
      } catch (mutationError) {
        toast.error(resolveApiError(mutationError, t('analysis.errors.suggestionFailed')));
      }
    },
    [suggestionMutation, t]
  );

  const handleStructuredChange = useCallback(
    async (structuredResume) => {
      setIsSavingText(true);
      try {
        await textMutation.mutateAsync({ structuredResume });
      } catch (mutationError) {
        toast.error(resolveApiError(mutationError, t('analysis.errors.textFailed')));
      } finally {
        setIsSavingText(false);
      }
    },
    [textMutation, t]
  );

  const handleSwitchToPreview = useCallback(async () => {
    if (viewMode === 'preview') return;

    const pending = editorRef.current?.flushPendingSave?.();
    if (pending) {
      await handleStructuredChange(pending);
    }

    setViewMode('preview');
  }, [viewMode, handleStructuredChange]);

  const previewSections = analysis
    ? hasStructuredResumeData(analysis.structuredResume)
      ? structuredResumeToSections(analysis.structuredResume)
      : analysis.structuredSections
    : null;
  const handleAcceptAll = useCallback(async () => {
    try {
      await acceptAllMutation.mutateAsync();
      toast.success(t('analysis.toasts.acceptAllSuccess'));
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.errors.acceptAllFailed')));
    }
  }, [acceptAllMutation, t]);

  const handleUndo = useCallback(async () => {
    try {
      await undoMutation.mutateAsync();
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.errors.undoFailed')));
    }
  }, [undoMutation, t]);

  const handleRedo = useCallback(async () => {
    try {
      await redoMutation.mutateAsync();
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.errors.redoFailed')));
    }
  }, [redoMutation, t]);

  return (
    <DashboardLayout user={user}>
      {isLoading ? (
        <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100dvh-7rem)]">
          <div className="w-full lg:w-[350px] shrink-0 space-y-4 rounded-xl border border-outline-variant/40 bg-white p-4">
            <Skeleton type="card" count={1} withMedia={false} lines={2} label={t('analysis.loading')} />
            <Skeleton type="list" count={4} />
            <Skeleton type="text" lines={4} />
          </div>
          <div className="flex-1 space-y-4 rounded-xl border border-outline-variant/40 bg-white p-6">
            <Skeleton type="text" lines={1} />
            <Skeleton type="list" count={1} />
            <Skeleton type="text" lines={12} />
          </div>
        </div>
      ) : null}

      {isError ? (
        <p className="font-body-md text-error" role="alert">
          {resolveApiError(error, t('overlay.failed'))}
        </p>
      ) : null}

      {analysis ? (
        <div className="flex flex-col lg:flex-row h-[calc(100dvh-7rem)] lg:h-[calc(100dvh-5.5rem)] -mx-4 lg:-mx-8 xl:-mx-10 border border-slate-200 bg-white overflow-hidden rounded-none lg:rounded-lg">
          <div className="w-full lg:w-[350px] shrink-0 max-h-[40vh] lg:max-h-none overflow-hidden">
            <SkillsSidebar analysis={analysis} />
          </div>

          <section className="flex-1 flex flex-col overflow-hidden bg-surface-container-low min-w-0">
            <div className="px-6 lg:px-8 pt-4 flex items-center justify-between bg-white border-b border-slate-200 shrink-0">
              <div className="flex gap-6 lg:gap-8 text-sm font-semibold">
                {WORKSPACE_TABS.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setWorkspaceTab(tab)}
                    className={cn(
                      'pb-3 transition-colors',
                      workspaceTab === tab
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-slate-400 hover:text-slate-600'
                    )}
                  >
                    {t(`analysis.workspaceTabs.${tab}`)}
                  </button>
                ))}
              </div>
              <div className="pb-3 flex items-center gap-2">
                <Link
                  to="/resume-scanner"
                  className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {t('analysis.toolbar.newAnalysis')}
                </Link>
              </div>
            </div>

            {workspaceTab === 'resume' ? (
              <SuggestionToolbar
                suggestionStats={analysis.suggestionStats}
                history={analysis.history}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onAcceptAll={handleAcceptAll}
                onContinueToEdit={() => setActiveStep(2)}
                showContinueToEdit={activeStep === 1}
                activeStep={activeStep}
                onStepChange={setActiveStep}
                jobMatchScore={analysis.jobMatchScore}
                isUndoing={undoMutation.isPending}
                isRedoing={redoMutation.isPending}
                isAcceptingAll={acceptAllMutation.isPending}
              />
            ) : null}

            {workspaceTab === 'resume' ? (
              <>
                <div className="px-6 lg:px-8 pt-3 flex items-center gap-2 bg-white border-b border-slate-200 shrink-0">
                  <button
                    type="button"
                    onClick={() => setViewMode('edit')}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full transition-colors',
                      viewMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    Edit (ATS text)
                  </button>
                  <button
                    type="button"
                    onClick={handleSwitchToPreview}
                    disabled={!analysis.resumeText && !analysis.structuredSections}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full transition-colors',
                      viewMode === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600',
                      !analysis.resumeText && !analysis.structuredSections && 'opacity-40 cursor-not-allowed'
                    )}
                  >
                    Preview
                  </button>
                </div>

                {viewMode === 'preview' ? (
                  <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex justify-center bg-slate-50 min-h-0">
                    <div className="w-full max-w-[800px]">
                      <StructuredResumeView
                        structuredSections={previewSections}
                        fallbackText={analysis.resumeText}
                      />
                    </div>
                  </div>
                ) : (
                  <ResumeEditor
                    ref={editorRef}
                    structuredResume={analysis.structuredResume}
                    suggestions={analysis.suggestions}
                    onStructuredChange={handleStructuredChange}
                    onSuggestionAction={handleSuggestionAction}
                    isSaving={isSavingText || textMutation.isPending}
                    isSuggestionLoading={suggestionMutation.isPending}
                    suggestionsEnabled={activeStep === 1}
                  />
                )}
              </>
            ) : null}

            {workspaceTab === 'coverLetter' ? (
              <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-slate-50">
                <div className="max-w-[800px] mx-auto bg-white p-8 lg:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[400px]">
                  {analysis.coverLetter || t('analysis.workspaceEmpty.coverLetter')}
                </div>
              </div>
            ) : null}

            {workspaceTab === 'jobDescription' ? (
              <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-slate-50">
                <div className="max-w-[800px] mx-auto bg-white p-8 lg:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[400px]">
                  {analysis.jobDescription?.rawText || t('analysis.workspaceEmpty.jobDescription')}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </DashboardLayout>
  );
}

```

## 2. FRONTEND — Components

### FILE: `frontend/src/features/resumeScanner/components/ResumeUploadPanel.jsx`

```jsx
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';

const ACCEPT = '.pdf,.docx';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function ResumeUploadPanel({ selectedFile, onFileSelect, fileError = '' }) {
  const { t } = useTranslation('resumeScanner');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSelect = (file) => {
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx'].includes(extension || '')) {
      onFileSelect(null, t('upload.errors.unsupportedFile'));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onFileSelect(null, t('upload.errors.fileTooLarge'));
      return;
    }

    onFileSelect(file, '');
  };

  return (
    <section className="dashboard-glass-card rounded-2xl p-md flex flex-col min-h-[500px]">
      <header className="mb-md">
        <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-xs">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10 text-secondary text-sm font-bold">
            1
          </span>
          {t('upload.step1Title')}
        </h3>
      </header>

      <div className="flex-1 flex flex-col">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            validateAndSelect(event.dataTransfer.files?.[0]);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'flex-1 flex flex-col justify-center items-center border-2 border-dashed rounded-xl bg-surface hover:bg-surface-container transition-all cursor-pointer group p-lg relative overflow-hidden',
            dragOver ? 'border-secondary/70 bg-secondary/5' : 'border-outline-variant hover:border-secondary/50'
          )}
        >
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, #0058be 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />
          <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10">
            <AppIcon name="upload_file" size="h-8 w-8" className="text-secondary" />
          </div>
          <p className="font-headline-md text-headline-md text-primary mb-1 relative z-10">
            {t('upload.dropzoneTitle')}
          </p>
          <p className="font-body-md text-body-md text-on-surface-variant mb-4 relative z-10">
            {t('upload.dropzoneHint')}
          </p>
          <div className="flex gap-2 font-label-sm text-label-sm text-on-surface-variant/80 relative z-10">
            <span className="bg-surface-container px-2 py-1 rounded-md">{t('upload.formats.pdf')}</span>
            <span className="bg-surface-container px-2 py-1 rounded-md">{t('upload.formats.docx')}</span>
            <span className="bg-surface-container px-2 py-1 rounded-md">{t('upload.formats.maxSize')}</span>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(event) => {
              validateAndSelect(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
        </div>

        {selectedFile ? (
          <div className="mt-md flex items-center justify-between gap-sm rounded-xl border border-outline-variant/50 bg-surface-container-low px-md py-sm">
            <p className="font-body-md text-on-surface truncate">
              {t('upload.selectedFile', { name: selectedFile.name })}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-label-sm text-secondary hover:underline shrink-0"
            >
              {t('upload.changeFile')}
            </button>
          </div>
        ) : null}

        {fileError ? (
          <p className="mt-sm font-body-sm text-error" role="alert">
            {fileError}
          </p>
        ) : null}
      </div>
    </section>
  );
}

```

### FILE: `frontend/src/features/resumeScanner/components/JobDescriptionPanel.jsx`

```jsx
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { buttonPrimaryClass } from '../../../components/ui/buttonTokens';
import { cn } from '../../../lib/utils';

export default function JobDescriptionPanel({
  jobDescription,
  onJobDescriptionChange,
  onClear,
  onAnalyze,
  isAnalyzing = false,
}) {
  const { t } = useTranslation('resumeScanner');

  return (
    <section className="dashboard-glass-card rounded-2xl p-md flex flex-col min-h-[500px] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-secondary via-[#8b5cf6] to-secondary opacity-50" />

      <header className="mb-md flex justify-between items-center gap-sm">
        <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-xs">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10 text-secondary text-sm font-bold">
            2
          </span>
          {t('upload.step2Title')}
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-secondary font-label-sm text-label-sm hover:underline"
        >
          {t('upload.clearText')}
        </button>
      </header>

      <div className="flex-1 flex flex-col relative group">
        <textarea
          value={jobDescription}
          onChange={(event) => onJobDescriptionChange(event.target.value)}
          placeholder={t('upload.jobDescriptionPlaceholder')}
          className="w-full flex-1 min-h-[320px] bg-surface-container-low text-on-surface border-none rounded-xl p-sm resize-none focus:ring-2 focus:ring-secondary/50 focus:bg-surface-container-lowest transition-all outline-none font-body-md text-body-md placeholder:text-outline/70 shadow-inner"
        />
        <div className="absolute bottom-4 end-4 flex items-center gap-2 text-outline-variant font-label-sm text-label-sm bg-surface-container-lowest/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-outline-variant/30 pointer-events-none">
          <AppIcon name="rate_review" size="h-4 w-4" />
          {t('upload.pasteHint')}
        </div>
      </div>

      <div className="mt-md pt-md border-t border-outline-variant/30 flex justify-end items-center gap-4">
        <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
          <AppIcon name="bolt" size="h-4 w-4" className="text-secondary" />
          {t('upload.poweredBy')}
        </p>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={cn(buttonPrimaryClass, 'px-lg py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,88,190,0.2)] gap-2')}
        >
          <AppIcon name="document_scanner" size="h-5 w-5" />
          {t('upload.analyze')}
        </button>
      </div>
    </section>
  );
}

```

### FILE: `frontend/src/features/resumeScanner/components/AnalyzeOverlay.jsx`

```jsx
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'motion/react';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';

const FLOATING_LABELS = [
  { key: 'skills', icon: 'psychology_alt', className: 'top-[20%] end-[10%]' },
  { key: 'experience', icon: 'history', className: 'top-[40%] start-[5%]' },
  { key: 'education', icon: 'school', className: 'bottom-[30%] end-[5%]' },
];

const getStatusTitleKey = (status) => {
  switch (status) {
    case 'pending':
      return 'overlay.queued';
    case 'extracting':
      return 'overlay.extracting';
    case 'analyzing':
      return 'overlay.analyzing';
    case 'completed':
      return 'overlay.complete';
    case 'failed':
      return 'overlay.failed';
    default:
      return 'overlay.processing';
  }
};

export default function AnalyzeOverlay({
  open,
  progress = 0,
  status = 'pending',
  statusMessage = '',
  extractedSkills = [],
}) {
  const { t } = useTranslation('resumeScanner');
  const title = t(getStatusTitleKey(status));
  const showSuccessTags = status === 'completed' && extractedSkills.length > 0;

  const displayProgress = useMemo(() => {
    if (status === 'completed') return 100;
    if (status === 'failed') return progress || 0;
    return Math.max(0, Math.min(100, progress || 0));
  }, [progress, status]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md px-sm"
        >
          <div className="relative w-full max-w-2xl flex flex-col items-center">
            <div className="relative w-[320px] h-[440px] rounded-xl shadow-2xl mb-xl overflow-hidden flex flex-col p-md bg-surface-container-lowest/80 backdrop-blur-xl border border-outline-variant/30">
              <div className="space-y-4 opacity-30">
                <div className="h-4 w-3/4 bg-on-surface-variant/20 rounded" />
                <div className="h-2 w-full bg-on-surface-variant/10 rounded" />
                <div className="h-2 w-full bg-on-surface-variant/10 rounded" />
                <div className="h-2 w-2/3 bg-on-surface-variant/10 rounded" />
                <div className="h-4 w-1/2 bg-on-surface-variant/20 rounded mt-md" />
                <div className="h-2 w-full bg-on-surface-variant/10 rounded" />
                <div className="h-2 w-5/6 bg-on-surface-variant/10 rounded" />
              </div>

              <motion.div
                className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_15px_#0058be]"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />

              {FLOATING_LABELS.map((label, index) => (
                <motion.div
                  key={label.key}
                  className={cn(
                    'absolute bg-surface-container-lowest px-4 py-2 rounded-full shadow-lg border border-outline-variant/30 text-label-md text-secondary flex items-center gap-2',
                    label.className
                  )}
                  animate={{ y: [0, -10, 0, 10, 0], x: [0, 5, 10, 5, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
                >
                  <AppIcon name={label.icon} size="h-[18px] w-[18px]" />
                  {t(`overlay.labels.${label.key}`)}
                </motion.div>
              ))}
            </div>

            <div className="text-center w-full max-w-md">
              <h2
                className={cn(
                  'font-headline-md text-headline-md text-primary mb-md',
                  status === 'completed' && 'text-secondary'
                )}
              >
                {title}
              </h2>
              {statusMessage ? (
                <p className="font-body-md text-on-surface-variant mb-sm">{statusMessage}</p>
              ) : null}
              <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-sm border border-outline-variant/20">
                <motion.div
                  className="h-full bg-secondary"
                  animate={{ width: `${displayProgress}%` }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                />
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                {t('overlay.progressComplete', { progress: displayProgress })}
              </p>
            </div>

            {showSuccessTags ? (
              <div className="flex flex-wrap justify-center gap-sm mt-lg">
                {extractedSkills.slice(0, 6).map((skill, index) => (
                  <motion.span
                    key={skill.id || skill.name}
                    initial={{ scale: 0.3, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 260,
                      damping: 18,
                      delay: index * 0.08,
                    }}
                    className="px-4 py-2 bg-secondary text-on-secondary rounded-full font-label-md shadow-md"
                  >
                    {skill.name}
                  </motion.span>
                ))}
              </div>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

```

### FILE: `frontend/src/features/resumeScanner/components/ResumeEditor.jsx`

```jsx
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import SuggestionPopover from './SuggestionPopover';
import {
  annotateFieldHtml,
  cloneStructuredResume,
  hasStructuredResumeData,
  updateField,
} from '../utils/structuredResumeUtils';
import { partitionSuggestions } from '../utils/resumeEditorUtils';
import { cn } from '../../../lib/utils';

const HEADING_CLASS =
  'ats-section-heading font-label-md uppercase tracking-wide text-secondary mt-3 mb-1';
const LINE_CLASS = 'ats-section-line outline-none';
const BULLET_CLASS = 'ats-section-line ats-bullet-line pl-3 outline-none';

const EditableLine = ({
  path,
  value = '',
  suggestions = [],
  suggestionsEnabled,
  bullet = false,
  onFieldChange,
  onSuggestionClick,
}) => {
  const ref = useRef(null);
  const composingRef = useRef(false);
  const lastExternalRef = useRef(value);

  const html = useMemo(
    () => annotateFieldHtml(value, path, suggestions, suggestionsEnabled),
    [value, path, suggestions, suggestionsEnabled]
  );

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (lastExternalRef.current === value && ref.current.getAttribute('data-synced') === '1') {
      // still refresh highlights when suggestions change while not focused
    }
    ref.current.innerHTML = html || '<br>';
    ref.current.setAttribute('data-synced', '1');
    lastExternalRef.current = value;
  }, [html, value]);

  const emit = () => {
    if (!ref.current || composingRef.current) return;
    const next = (ref.current.innerText || '').replace(/\u00a0/g, ' ').trimEnd();
    if (next === lastExternalRef.current) return;
    lastExternalRef.current = next;
    onFieldChange?.(path, next);
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      data-field-path={path}
      className={cn(bullet ? BULLET_CLASS : LINE_CLASS)}
      onInput={emit}
      onBlur={emit}
      onClick={onSuggestionClick}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
        emit();
      }}
    />
  );
};

const ResumeEditor = forwardRef(function ResumeEditor(
  {
    structuredResume = null,
    suggestions = [],
    onStructuredChange,
    onSuggestionAction,
    isSaving = false,
    isSuggestionLoading = false,
    suggestionsEnabled = true,
  },
  ref
) {
  const { t } = useTranslation('resumeScanner');
  const [local, setLocal] = useState(() => cloneStructuredResume(structuredResume));
  const pendingRef = useRef(null);
  const saveTimerRef = useRef(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);

  useEffect(() => {
    if (!hasStructuredResumeData(structuredResume)) return;
    setLocal(cloneStructuredResume(structuredResume));
    pendingRef.current = null;
  }, [structuredResume]);

  const { pending, unanchored } = useMemo(() => partitionSuggestions(suggestions), [suggestions]);

  const flushPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!pendingRef.current) return null;
    const next = pendingRef.current;
    pendingRef.current = null;
    onStructuredChange?.(next);
    return next;
  }, [onStructuredChange]);

  useImperativeHandle(ref, () => ({ flushPendingSave }), [flushPendingSave]);

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  const handleFieldChange = useCallback(
    (path, value) => {
      setLocal((prev) => {
        const next = updateField(prev, path, value);
        pendingRef.current = next;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null;
          const payload = pendingRef.current;
          pendingRef.current = null;
          if (payload) onStructuredChange?.(payload);
        }, 700);
        return next;
      });
    },
    [onStructuredChange]
  );

  const openSuggestion = (suggestion, target) => {
    if (!suggestionsEnabled) return;
    setSelectedSuggestion(suggestion);
    setAnchorRect(target?.getBoundingClientRect?.() || null);
  };

  const handleSuggestionClick = (event) => {
    if (!suggestionsEnabled) return;
    const target = event.target.closest('[data-suggestion-id]');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();
    const suggestionId = target.getAttribute('data-suggestion-id');
    const suggestion = pending.find((item) => item.id === suggestionId);
    if (!suggestion) return;
    openSuggestion(suggestion, target);
  };

  const closePopover = () => {
    setSelectedSuggestion(null);
    setAnchorRect(null);
  };

  const handleSuggestionDecision = async (suggestion, action) => {
    await onSuggestionAction?.(suggestion, action);
    closePopover();
  };

  const contactLine = [local.contact.email, local.contact.phone, local.contact.address]
    .filter(Boolean)
    .join(' | ');

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex justify-center bg-slate-50 min-h-0">
      <div className="w-full max-w-[800px]">
        {isSaving ? (
          <p className="text-xs text-slate-400 mb-2 text-end">{t('analysis.editor.saving')}</p>
        ) : null}

        <div
          className={cn(
            'resume-paper w-full bg-white p-8 lg:p-12 text-slate-800 leading-relaxed text-[13px]',
            'min-h-[1000px] whitespace-pre-wrap outline-none shadow-[0_4px_20px_rgba(0,0,0,0.05)]',
            'focus-within:ring-4 focus-within:ring-blue-100 transition-shadow'
          )}
          aria-label={t('analysis.editor.ariaLabel')}
        >
          <EditableLine
            path="name"
            value={local.name}
            suggestions={suggestions}
            suggestionsEnabled={suggestionsEnabled}
            onFieldChange={handleFieldChange}
            onSuggestionClick={handleSuggestionClick}
          />

          <EditableLine
            path="contact.email"
            value={contactLine}
            suggestions={suggestions}
            suggestionsEnabled={suggestionsEnabled}
            onFieldChange={(_path, value) => {
              // Keep contact as a single visual line; store into email for simplicity when free-edited
              // Prefer structured fields when pipe-separated
              const parts = String(value || '')
                .split('|')
                .map((p) => p.trim())
                .filter(Boolean);
              let next = local;
              if (parts.length >= 1) next = updateField(next, 'contact.email', parts[0] || '');
              if (parts.length >= 2) next = updateField(next, 'contact.phone', parts[1] || '');
              if (parts.length >= 3) next = updateField(next, 'contact.address', parts.slice(2).join(' | '));
              if (parts.length === 0) {
                next = updateField(next, 'contact.email', '');
                next = updateField(next, 'contact.phone', '');
                next = updateField(next, 'contact.address', '');
              }
              setLocal(next);
              pendingRef.current = next;
              if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
              saveTimerRef.current = setTimeout(() => {
                saveTimerRef.current = null;
                const payload = pendingRef.current;
                pendingRef.current = null;
                if (payload) onStructuredChange?.(payload);
              }, 700);
            }}
            onSuggestionClick={handleSuggestionClick}
          />

          <div className="h-2" aria-hidden="true" />

          <div className={HEADING_CLASS} contentEditable={false}>
            PROFESSIONAL SUMMARY
          </div>
          <EditableLine
            path="summary"
            value={local.summary}
            suggestions={suggestions}
            suggestionsEnabled={suggestionsEnabled}
            onFieldChange={handleFieldChange}
            onSuggestionClick={handleSuggestionClick}
          />

          {local.workExperience.length ? (
            <>
              <div className={HEADING_CLASS} contentEditable={false}>
                WORK EXPERIENCE
              </div>
              {local.workExperience.map((job, i) => (
                <div key={`job-${i}`} className="mb-1">
                  <EditableLine
                    path={`workExperience.${i}.title`}
                    value={[job.title, job.company].filter(Boolean).join(', ')}
                    suggestions={suggestions}
                    suggestionsEnabled={suggestionsEnabled}
                    onFieldChange={(_path, value) => {
                      const parts = String(value || '').split(/\s*,\s*/);
                      let next = updateField(local, `workExperience.${i}.title`, parts[0] || '');
                      next = updateField(next, `workExperience.${i}.company`, parts.slice(1).join(', '));
                      setLocal(next);
                      pendingRef.current = next;
                      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                      saveTimerRef.current = setTimeout(() => {
                        saveTimerRef.current = null;
                        const payload = pendingRef.current;
                        pendingRef.current = null;
                        if (payload) onStructuredChange?.(payload);
                      }, 700);
                    }}
                    onSuggestionClick={handleSuggestionClick}
                  />
                  <EditableLine
                    path={`workExperience.${i}.duration`}
                    value={job.duration}
                    suggestions={suggestions}
                    suggestionsEnabled={suggestionsEnabled}
                    onFieldChange={handleFieldChange}
                    onSuggestionClick={handleSuggestionClick}
                  />
                  {job.bullets.map((bullet, j) => (
                    <EditableLine
                      key={`bullet-${i}-${j}`}
                      path={`workExperience.${i}.bullets.${j}`}
                      value={bullet.startsWith('•') || bullet.startsWith('-') ? bullet : `• ${bullet}`}
                      bullet
                      suggestions={suggestions}
                      suggestionsEnabled={suggestionsEnabled}
                      onFieldChange={(path, value) => {
                        const cleaned = String(value || '').replace(/^[-•*]\s*/, '').trim();
                        handleFieldChange(path, cleaned);
                      }}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  ))}
                </div>
              ))}
            </>
          ) : null}

          {local.education.length ? (
            <>
              <div className={HEADING_CLASS} contentEditable={false}>
                EDUCATION
              </div>
              {local.education.map((ed, i) => (
                <div key={`edu-${i}`}>
                  <EditableLine
                    path={`education.${i}.degree`}
                    value={[ed.degree, ed.institution].filter(Boolean).join(', ')}
                    suggestions={suggestions}
                    suggestionsEnabled={suggestionsEnabled}
                    onFieldChange={(_path, value) => {
                      const parts = String(value || '').split(/\s*,\s*/);
                      let next = updateField(local, `education.${i}.degree`, parts[0] || '');
                      next = updateField(next, `education.${i}.institution`, parts.slice(1).join(', '));
                      setLocal(next);
                      pendingRef.current = next;
                      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                      saveTimerRef.current = setTimeout(() => {
                        saveTimerRef.current = null;
                        const payload = pendingRef.current;
                        pendingRef.current = null;
                        if (payload) onStructuredChange?.(payload);
                      }, 700);
                    }}
                    onSuggestionClick={handleSuggestionClick}
                  />
                  <EditableLine
                    path={`education.${i}.duration`}
                    value={ed.duration}
                    suggestions={suggestions}
                    suggestionsEnabled={suggestionsEnabled}
                    onFieldChange={handleFieldChange}
                    onSuggestionClick={handleSuggestionClick}
                  />
                </div>
              ))}
            </>
          ) : null}

          {local.skills.length ? (
            <>
              <div className={HEADING_CLASS} contentEditable={false}>
                SKILLS
              </div>
              <EditableLine
                path="skills"
                value={local.skills.join(', ')}
                suggestions={suggestions}
                suggestionsEnabled={suggestionsEnabled}
                onFieldChange={(_path, value) => {
                  const skills = String(value || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  handleFieldChange('skills', skills);
                }}
                onSuggestionClick={handleSuggestionClick}
              />
            </>
          ) : null}

          {local.languages.length ? (
            <>
              <div className={HEADING_CLASS} contentEditable={false}>
                LANGUAGES
              </div>
              <EditableLine
                path="languages"
                value={local.languages.join(', ')}
                suggestions={suggestions}
                suggestionsEnabled={suggestionsEnabled}
                onFieldChange={(_path, value) => {
                  const languages = String(value || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  handleFieldChange('languages', languages);
                }}
                onSuggestionClick={handleSuggestionClick}
              />
            </>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-400">
            {suggestionsEnabled
              ? t('analysis.editor.hint', { count: pending.length })
              : t('analysis.editor.editHint')}
          </p>

          {suggestionsEnabled && unanchored.length ? (
            <div className="space-y-2" data-ats-chrome="true">
              <p className="text-xs text-slate-500">{t('analysis.editor.unanchoredTitle')}</p>
              <div className="flex flex-wrap gap-2">
                {unanchored.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    data-ats-chrome="true"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-colors bg-white"
                    onClick={(event) => openSuggestion(suggestion, event.currentTarget)}
                  >
                    {t(`analysis.suggestionTypes.${suggestion.type}`)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {suggestionsEnabled && selectedSuggestion ? (
          <SuggestionPopover
            suggestion={selectedSuggestion}
            anchorRect={anchorRect}
            isLoading={isSuggestionLoading}
            onClose={closePopover}
            onAccept={(suggestion) => handleSuggestionDecision(suggestion, 'accept')}
            onReject={(suggestion) => handleSuggestionDecision(suggestion, 'reject')}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
});

export default ResumeEditor;

```

### FILE: `frontend/src/features/resumeScanner/components/StructuredResumeView.jsx`

```jsx
import { cn } from '../../../lib/utils';

const renderParagraphLines = (paragraph = '') =>
  paragraph.split('\n').map((line, idx) => {
    const trimmed = line.trim();
    const isBullet = /^[-•*]\s+/.test(trimmed);
    return (
      <p
        key={idx}
        className={cn(
          'text-[13px] leading-relaxed text-slate-700',
          isBullet && 'pl-4 relative before:content-["•"] before:absolute before:left-0 before:text-slate-400'
        )}
      >
        {isBullet ? trimmed.replace(/^[-•*]\s+/, '') : trimmed}
      </p>
    );
  });

const Section = ({ title, section }) => {
  const paragraphs = section?.paragraphs?.length ? section.paragraphs : (section?.text ? [section.text] : []);
  if (!paragraphs.length) return null;

  return (
    <section className="mb-6">
      <h3 className="text-[12px] font-bold tracking-wide uppercase text-blue-700 border-b border-slate-200 pb-1 mb-2">
        {title}
      </h3>
      <div className="space-y-1">
        {paragraphs.map((para, idx) => (
          <div key={idx}>{renderParagraphLines(para)}</div>
        ))}
      </div>
    </section>
  );
};

export const hasStructuredPreviewData = (structuredSections = {}) => {
  const {
    contact,
    summary,
    experience,
    education,
    skills,
    additional_sections: additionalSections = [],
    unassigned,
  } = structuredSections;

  return Boolean(
    contact?.name ||
      contact?.lines?.length ||
      summary?.text ||
      experience?.text ||
      education?.text ||
      skills?.text ||
      skills?.items?.length ||
      unassigned?.text ||
      additionalSections.some((section) => section?.text || section?.paragraphs?.length)
  );
};

const PlainTextFallback = ({ text = '' }) => (
  <div className="resume-paper w-full bg-white p-8 lg:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
    {text}
  </div>
);

export default function StructuredResumeView({ structuredSections = {}, fallbackText = '' }) {
  const { contact, summary, experience, education, skills, additional_sections: additionalSections = [] } =
    structuredSections;

  if (!hasStructuredPreviewData(structuredSections)) {
    if (fallbackText?.trim()) {
      return <PlainTextFallback text={fallbackText} />;
    }
    return null;
  }

  return (
    <div className="resume-paper w-full bg-white p-8 lg:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
      {contact?.name || contact?.lines?.length ? (
        <header className="mb-6 text-center">
          {contact?.name ? <h1 className="text-xl font-bold text-slate-900">{contact.name}</h1> : null}
          {contact.headline ? (
            <p className="text-sm text-slate-500 mt-1">{contact.headline}</p>
          ) : null}
          {contact.lines?.length ? (
            <p className="text-xs text-slate-500 mt-2">{contact.lines.join('  |  ')}</p>
          ) : null}
        </header>
      ) : null}

      <Section title="Professional Summary" section={summary} />
      <Section title="Work Experience" section={experience} />
      <Section title="Education" section={education} />

      {skills?.items?.length ? (
        <section className="mb-6">
          <h3 className="text-[12px] font-bold tracking-wide uppercase text-blue-700 border-b border-slate-200 pb-1 mb-2">
            Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {skills.items.map((item, idx) => (
              <span
                key={idx}
                className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-full"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      ) : (
        <Section title="Skills" section={skills} />
      )}

      {additionalSections.map((extra, idx) => (
        <Section key={idx} title={extra.heading || extra.type} section={extra} />
      ))}

      {structuredSections?.unassigned?.text ? (
        <Section
          title="Additional"
          section={{ text: structuredSections.unassigned.text, paragraphs: [structuredSections.unassigned.text] }}
        />
      ) : null}
    </div>
  );
}

```

### FILE: `frontend/src/features/resumeScanner/components/SkillsSidebar.jsx`

```jsx
import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';
import { getSkillDisplayName } from '../utils/resumeEditorUtils';
import AtsScoreGauge from './AtsScoreGauge';

const TABS = ['skills', 'searchability', 'recruiterTips'];

function getPerSkillSuggestionCounts(skillId, suggestions = []) {
  const linked = suggestions.filter(
    (suggestion) =>
      suggestion.targetSkillId === skillId &&
      (suggestion.status === 'pending' || suggestion.status === 'accepted')
  );
  const accepted = linked.filter((suggestion) => suggestion.status === 'accepted').length;
  return { accepted, total: linked.length };
}

function sortMatchedFirst(skills = []) {
  return [...skills].sort((left, right) => Number(Boolean(right.matched)) - Number(Boolean(left.matched)));
}

function SkillRow({ skill, suggestions, t }) {
  const { accepted, total } = getPerSkillSuggestionCounts(skill.id, suggestions);
  const matched = Boolean(skill.matched);

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 gap-2 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <AppIcon
          name={matched ? 'check_circle' : 'cancel'}
          size="nav"
          className={cn('shrink-0', matched ? 'text-green-600' : 'text-red-500')}
          aria-hidden
        />
        <span className="text-sm text-slate-700 break-words">{getSkillDisplayName(skill)}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <AppIcon name="flag" size="sm" className="text-slate-300" aria-hidden />
        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded text-[10px] text-slate-400">
          <AppIcon name="sparkles" size="sm" className="text-blue-500" />
          <span>{t('analysis.skills.aiSuggestedPerSkill', { accepted, total })}</span>
        </div>
      </div>
    </div>
  );
}

function SkillCategorySection({
  title,
  infoLabel,
  skills,
  suggestions,
  showMissingCount = false,
  t,
}) {
  const orderedSkills = useMemo(() => sortMatchedFirst(skills), [skills]);
  const matchedCount = skills.filter((skill) => skill.matched).length;
  const missingCount = skills.length - matchedCount;

  return (
    <div>
      <div className="flex justify-between items-center mb-3 gap-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
          {title}
          <span title={infoLabel} aria-label={infoLabel} className="inline-flex">
            <AppIcon name="help" size="sm" className="text-slate-400" />
          </span>
        </h3>
        <div className="flex gap-2 text-[10px] text-slate-500 shrink-0">
          <span>
            {t('analysis.skills.matchedLabel')}{' '}
            <span className="bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">
              {matchedCount}
            </span>
          </span>
          {showMissingCount ? (
            <span>
              {t('analysis.skills.missingLabel')}{' '}
              <span className="text-red-600 font-bold">{missingCount}</span>
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-1">
        {orderedSkills.length ? (
          orderedSkills.map((skill) => (
            <SkillRow key={skill.id} skill={skill} suggestions={suggestions} t={t} />
          ))
        ) : (
          <p className="text-sm text-slate-400 py-2">{t('analysis.skills.emptyCategory')}</p>
        )}
      </div>
    </div>
  );
}

function BreakdownBar({ label, value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-800 font-medium">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}

export default function SkillsSidebar({ analysis }) {
  const { t } = useTranslation('resumeScanner');
  const [activeTab, setActiveTab] = useState('skills');

  const allSkills = analysis?.skills || [];
  const suggestions = analysis?.suggestions || [];
  const requiredSkills = useMemo(
    () => allSkills.filter((skill) => skill.type === 'required'),
    [allSkills]
  );
  const hardSkills = useMemo(
    () => allSkills.filter((skill) => skill.type === 'hard'),
    [allSkills]
  );

  const breakdown = analysis?.atsScoreBreakdown || {};
  const issues = analysis?.searchabilityIssues || [];
  const tips = analysis?.recruiterTips || [];
  const company = analysis?.jobDescription?.company || t('analysis.defaultJobTitle');
  const jobTitle = analysis?.jobDescription?.title || '';

  return (
    <aside className="h-full flex flex-col bg-white border-r border-slate-200 min-h-0">
      <div className="p-4 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-4 mb-4">
          <AtsScoreGauge
            jobMatchScore={analysis?.jobMatchScore}
            atsScore={analysis?.atsScore}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-bold text-slate-800 truncate">{company}</h2>
              <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 shrink-0">
                {t('analysis.atsTipBadge')}
              </span>
            </div>
            {jobTitle ? (
              <p className="text-slate-500 text-sm truncate flex items-center gap-1">
                <span className="truncate">{jobTitle}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex text-sm font-medium border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 transition-colors',
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {t(`analysis.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'skills' ? (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <SkillCategorySection
                title={t('analysis.skills.requiredSkills')}
                infoLabel={t('analysis.skills.requiredInfo')}
                skills={requiredSkills}
                suggestions={suggestions}
                t={t}
              />
              <SkillCategorySection
                title={t('analysis.skills.hardSkills')}
                infoLabel={t('analysis.skills.hardInfo')}
                skills={hardSkills}
                suggestions={suggestions}
                showMissingCount
                t={t}
              />
            </motion.div>
          ) : null}

          {activeTab === 'searchability' ? (
            <motion.div
              key="searchability"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <BreakdownBar
                  label={t('analysis.searchability.sectionCompleteness')}
                  value={breakdown.sectionCompleteness}
                />
                <BreakdownBar
                  label={t('analysis.searchability.searchability')}
                  value={breakdown.searchability}
                />
                <BreakdownBar
                  label={t('analysis.searchability.quantifiedAchievements')}
                  value={breakdown.quantifiedAchievements}
                />
              </div>
              <section>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">
                  {t('analysis.searchability.issues')}
                </h3>
                {issues.length ? (
                  <ul className="space-y-2">
                    {issues.map((issue) => (
                      <li key={issue} className="text-sm text-slate-500 flex gap-2 items-start">
                        <AppIcon name="alert-circle" size="sm" className="text-amber-600 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">{t('analysis.searchability.noIssues')}</p>
                )}
              </section>
            </motion.div>
          ) : null}

          {activeTab === 'recruiterTips' ? (
            <motion.div
              key="recruiterTips"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              {tips.length ? (
                <ul className="space-y-3">
                  {tips.map((tip) => (
                    <li key={tip} className="text-sm text-slate-500 flex gap-2 items-start">
                      <AppIcon name="lightbulb" size="sm" className="text-blue-600 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">{t('analysis.recruiterTips.empty')}</p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </aside>
  );
}

```

### FILE: `frontend/src/features/resumeScanner/components/AtsScoreGauge.jsx`

```jsx
import { useEffect, useMemo } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { getScoreColor, getScoreTone } from '../utils/resumeEditorUtils';
import { cn } from '../../../lib/utils';

const GAUGE_SIZE = 56;
const STROKE = 4;
const RADIUS = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Compact circular score (Option A / HTML mock).
 * jobMatchScore drives the ring; atsScore is accepted for API compatibility but not shown.
 */
export default function AtsScoreGauge({ jobMatchScore = 0, atsScore: _atsScore = 0 }) {
  const matchScore = Math.max(0, Math.min(100, Number(jobMatchScore) || 0));
  const tone = getScoreTone(matchScore);
  const strokeColor = getScoreColor(matchScore);
  const spring = useSpring(matchScore, { stiffness: 90, damping: 18 });
  const displayScore = useTransform(spring, (value) => Math.round(value));

  useEffect(() => {
    spring.set(matchScore);
  }, [matchScore, spring]);

  const dashOffset = useMemo(
    () => CIRCUMFERENCE - (matchScore / 100) * CIRCUMFERENCE,
    [matchScore]
  );

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
      aria-label={`Score ${matchScore}`}
    >
      <svg
        width={GAUGE_SIZE}
        height={GAUGE_SIZE}
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={RADIUS}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-slate-100"
        />
        <motion.circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={RADIUS}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>
      <motion.span
        className={cn(
          'absolute text-xl font-bold tabular-nums',
          tone === 'good' && 'text-green-600',
          tone === 'fair' && 'text-amber-600',
          tone === 'poor' && 'text-red-600'
        )}
      >
        {displayScore}
      </motion.span>
    </div>
  );
}

```

### FILE: `frontend/src/features/resumeScanner/components/SuggestionToolbar.jsx`

```jsx
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';

export default function SuggestionToolbar({
  suggestionStats,
  history,
  onUndo,
  onRedo,
  onAcceptAll,
  onContinueToEdit,
  showContinueToEdit = false,
  activeStep = 1,
  onStepChange,
  jobMatchScore = 0,
  isUndoing = false,
  isRedoing = false,
  isAcceptingAll = false,
}) {
  const { t } = useTranslation('resumeScanner');
  const accepted = suggestionStats?.accepted ?? 0;
  const total = suggestionStats?.total ?? 0;
  const pending = suggestionStats?.pending ?? 0;
  const progress = Math.max(0, Math.min(100, Number(jobMatchScore) || 0));

  return (
    <div className="px-6 lg:px-8 py-4 bg-white border-b border-slate-200 flex flex-col gap-3 shrink-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-6" role="navigation" aria-label={t('analysis.steps.ariaLabel')}>
          <button
            type="button"
            onClick={() => onStepChange?.(1)}
            className="flex items-center gap-2"
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                activeStep === 1 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              )}
            >
              1
            </div>
            <span
              className={cn(
                'text-sm',
                activeStep === 1 ? 'font-bold text-slate-900' : 'font-medium text-slate-400'
              )}
            >
              {t('analysis.steps.suggestionsProgress', { accepted, total })}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onStepChange?.(2)}
            className="flex items-center gap-2"
          >
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                activeStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              )}
            >
              2
            </div>
            <span
              className={cn(
                'text-sm',
                activeStep === 2 ? 'font-bold text-slate-900' : 'font-medium text-slate-400'
              )}
            >
              {t('analysis.steps.edit')}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 mr-1">
            <button
              type="button"
              disabled={!history?.canUndo || isUndoing}
              onClick={onUndo}
              className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors disabled:opacity-40"
              aria-label={t('analysis.toolbar.undo')}
            >
              <AppIcon name="undo-2" size="nav" />
            </button>
            <button
              type="button"
              disabled={!history?.canRedo || isRedoing}
              onClick={onRedo}
              className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors disabled:opacity-40"
              aria-label={t('analysis.toolbar.redo')}
            >
              <AppIcon name="redo-2" size="nav" />
            </button>
          </div>

          <button
            type="button"
            disabled={pending === 0 || isAcceptingAll}
            onClick={onAcceptAll}
            className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {t('analysis.toolbar.acceptAll')}
          </button>

          {showContinueToEdit ? (
            <button
              type="button"
              onClick={onContinueToEdit}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              {t('analysis.toolbar.continue')}
            </button>
          ) : (
            <Link
              to="/resume-scanner"
              className="px-6 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              {t('analysis.toolbar.newAnalysis')}
            </Link>
          )}
        </div>
      </div>

      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

```

### FILE: `frontend/src/features/resumeScanner/components/SuggestionPopover.jsx`

```jsx
import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';

export default function SuggestionPopover({
  suggestion,
  anchorRect,
  onAccept,
  onReject,
  onClose,
  isLoading = false,
}) {
  const { t } = useTranslation('resumeScanner');
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!suggestion || !anchorRect) {
    return null;
  }

  const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 280);
  const left = Math.min(Math.max(16, anchorRect.left), window.innerWidth - 340);
  const hasSuggested = Boolean(suggestion.suggested);

  return (
    <motion.div
      ref={popoverRef}
      role="dialog"
      aria-label={t('analysis.popover.title')}
      initial={{ opacity: 0, y: 8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      className="fixed z-[100] w-80 bg-white rounded-lg shadow-xl border border-slate-200 text-sm overflow-hidden font-sans"
      style={{ top, left }}
    >
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-start gap-2">
        <div className="min-w-0">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <AppIcon name="sparkles" size="sm" className="text-blue-600" />
            {t('analysis.popover.title')}
          </span>
          {suggestion.reason ? (
            <p className="text-xs text-slate-500 mt-1">{suggestion.reason}</p>
          ) : null}
        </div>
        {suggestion.impact ? (
          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded whitespace-nowrap shrink-0">
            {t('analysis.popover.impactShort', { points: suggestion.impact })}
          </span>
        ) : null}
      </div>

      <div className="p-3">
        {suggestion.original ? (
          <div className="mb-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              {t('analysis.popover.currentText')}
            </span>
            <div className="line-through text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs">
              {suggestion.original}
            </div>
          </div>
        ) : null}

        <div className="mb-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            {t('analysis.popover.suggestedChange')}
          </span>
          <div
            className={cn(
              'px-2 py-1 rounded font-medium text-xs border',
              hasSuggested
                ? 'text-green-700 bg-green-50 border-green-100'
                : 'text-red-600 bg-red-50 border-red-100'
            )}
          >
            {hasSuggested ? suggestion.suggested : t('analysis.popover.removeText')}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onReject?.(suggestion)}
            className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-medium transition-colors text-xs disabled:opacity-60"
          >
            {t('analysis.popover.reject')}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onAccept?.(suggestion)}
            className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors text-xs shadow-sm disabled:opacity-60"
          >
            {t('analysis.popover.accept')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

```

## 3. FRONTEND — Hooks, Services, Utils

### FILE: `frontend/src/features/resumeScanner/hooks/useResumeScanner.js`

```javascript
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  acceptAllSuggestions,
  fetchResumeScannerAnalysis,
  fetchResumeScannerStatus,
  redoResumeScannerChange,
  undoResumeScannerChange,
  updateResumeScannerText,
  updateSuggestionStatus,
  uploadResumeScanner,
} from '../services/resumeScannerService';

const analysisQueryKey = (analysisId) => ['resume-scanner-analysis', analysisId];

const setAnalysisCache = (queryClient, analysisId, payload) => {
  queryClient.setQueryData(analysisQueryKey(analysisId), payload);
};

const TERMINAL_STATUSES = new Set(['completed', 'failed']);

export const useUploadResumeScanner = () =>
  useMutation({
    mutationFn: uploadResumeScanner,
  });

export const useResumeScannerStatus = (analysisId, enabled = false) =>
  useQuery({
    queryKey: ['resume-scanner-status', analysisId],
    queryFn: () => fetchResumeScannerStatus(analysisId),
    enabled: Boolean(analysisId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || TERMINAL_STATUSES.has(status)) {
        return false;
      }
      return 1200;
    },
  });

export const useResumeScannerAnalysis = (analysisId, enabled = false) =>
  useQuery({
    queryKey: analysisQueryKey(analysisId),
    queryFn: () => fetchResumeScannerAnalysis(analysisId),
    select: (data) => data.analysis,
    enabled: Boolean(analysisId) && enabled,
  });

export const useUpdateSuggestionStatus = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ suggestionId, action }) =>
      updateSuggestionStatus(analysisId, suggestionId, action),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useAcceptAllSuggestions = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => acceptAllSuggestions(analysisId),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useUpdateResumeScannerText = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => updateResumeScannerText(analysisId, payload),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useUndoResumeScannerChange = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => undoResumeScannerChange(analysisId),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

export const useRedoResumeScannerChange = (analysisId) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => redoResumeScannerChange(analysisId),
    onSuccess: (data) => {
      setAnalysisCache(queryClient, analysisId, data);
    },
  });
};

```

### FILE: `frontend/src/features/resumeScanner/services/resumeScannerService.js`

```javascript
import api from '../../../services/authService';

const unwrap = (response) => response.data;

export const uploadResumeScanner = ({ file, jobDescription }) => {
  const formData = new FormData();
  formData.append('jobDescription', jobDescription);
  formData.append('mode', 'upload');

  if (file) {
    formData.append('resume', file);
  }

  return api
    .post('/resume-scanner/upload', formData, {
      transformRequest: [
        (data, headers) => {
          if (data instanceof FormData) {
            delete headers['Content-Type'];
          }
          return data;
        },
      ],
    })
    .then(unwrap);
};

export const fetchResumeScannerStatus = (analysisId) =>
  api.get(`/resume-scanner/${analysisId}/status`).then(unwrap);

export const fetchResumeScannerAnalysis = (analysisId) =>
  api.get(`/resume-scanner/${analysisId}`).then(unwrap);

export const updateSuggestionStatus = (analysisId, suggestionId, action) =>
  api
    .patch(`/resume-scanner/${analysisId}/suggestion/${suggestionId}`, { action })
    .then(unwrap);

export const acceptAllSuggestions = (analysisId) =>
  api.post(`/resume-scanner/${analysisId}/accept-all`).then(unwrap);

export const updateResumeScannerText = (analysisId, payload) => {
  const body =
    typeof payload === 'string'
      ? { resumeText: payload }
      : payload && typeof payload === 'object'
        ? payload
        : { resumeText: '' };

  return api.patch(`/resume-scanner/${analysisId}/text`, body).then(unwrap);
};

export const undoResumeScannerChange = (analysisId) =>
  api.post(`/resume-scanner/${analysisId}/undo`).then(unwrap);

export const redoResumeScannerChange = (analysisId) =>
  api.post(`/resume-scanner/${analysisId}/redo`).then(unwrap);

```

### FILE: `frontend/src/features/resumeScanner/utils/resumeEditorUtils.js`

```javascript
const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** HTML-mock highlight styles via Tailwind (red / green / missing). */
const HIGHLIGHT = {
  red: 'line-through text-[#991b1b] bg-[#fee2e2] px-0.5 rounded-sm',
  green: 'text-[#166534] bg-[#dcfce7] px-0.5 rounded-sm font-medium',
  missing: 'text-[#ef4444] border-b-2 border-[#ef4444]',
};

export const getSkillDisplayName = (skill = {}) =>
  skill.name || skill.skillName || skill.label || skill.skill || skill.id || '';

const SECTION_HEADING_RE =
  /^(PROFESSIONAL SUMMARY|WORK EXPERIENCE|EDUCATION|SKILLS|CERTIFICATIONS|PROJECTS|LANGUAGES|AWARDS|VOLUNTEER EXPERIENCE|INTERESTS|REFERENCES|SUMMARY|EXPERIENCE|CORE COMPETENCIES)$/i;

const BULLET_LINE_RE = /^[-•*]\s+/;

const isSectionHeadingLine = (line = '') => {
  const trimmed = String(line || '').trim();
  return Boolean(trimmed) && SECTION_HEADING_RE.test(trimmed);
};

const suggestionWrapAttrs = (suggestionId) =>
  `contenteditable="false" class="ats-suggestion cursor-pointer suggestion-trigger" data-suggestion-id="${escapeHtml(suggestionId)}" role="button" tabindex="0"`;

const renderTextSegment = (segment, suggestions, segmentStart) => {
  const segmentEnd = segmentStart + segment.length;
  const active = suggestions.filter(
    (item) => item.charStart < segmentEnd && item.charEnd > segmentStart
  );

  if (!active.length) {
    return escapeHtml(segment);
  }

  let cursor = 0;
  const parts = [];

  for (const suggestion of active) {
    const start = Math.max(0, suggestion.charStart - segmentStart);
    const end = Math.min(segment.length, suggestion.charEnd - segmentStart);
    if (end <= start) continue;

    if (start > cursor) {
      parts.push(escapeHtml(segment.slice(cursor, start)));
    }

    const highlighted = segment.slice(start, end);
    const originalText = highlighted || suggestion.original || '';
    const suggestedText = suggestion.suggested || '';
    const attrs = suggestionWrapAttrs(suggestion.id);

    let innerHtml = '';
    if (suggestion.type === 'remove' || !suggestedText) {
      innerHtml = `<span class="ats-suggestion-original ${HIGHLIGHT.red}">${escapeHtml(originalText)}</span>`;
    } else if (suggestion.type === 'missing_keyword') {
      // Mock: missing underline on anchor; green for suggested addition when present.
      if (originalText) {
        innerHtml += `<span class="ats-suggestion-original ${HIGHLIGHT.missing}">${escapeHtml(originalText)}</span>`;
      }
      if (suggestedText) {
        innerHtml += `<span class="ats-suggestion-replacement ${HIGHLIGHT.green}">${originalText ? ' ' : ''}${escapeHtml(suggestedText)}</span>`;
      }
    } else {
      // reword: red strikethrough original + green suggested (HTML mock pair).
      innerHtml = `<span class="ats-suggestion-original ${HIGHLIGHT.red}">${escapeHtml(originalText)}</span> <span class="ats-suggestion-replacement ${HIGHLIGHT.green}">${escapeHtml(suggestedText)}</span>`;
    }

    parts.push(`<span ${attrs}>${innerHtml}</span>`);
    cursor = end;
  }

  if (cursor < segment.length) {
    parts.push(escapeHtml(segment.slice(cursor)));
  }

  return parts.join('');
};

export const buildResumeTextFromLineMap = (lineMap = []) => {
  if (!Array.isArray(lineMap) || lineMap.length === 0) {
    return '';
  }

  return [...lineMap]
    .sort((left, right) => (left.line_number ?? 0) - (right.line_number ?? 0))
    .map((line) => (line?.text == null ? '' : String(line.text)))
    .join('\n')
    .trimEnd();
};

export const resolveResumeDisplayText = ({ resumeText = '', lineMap = [] } = {}) => {
  // Prefer ATS resumeText — suggestions and Preview both use this field.
  // lineMap is only a fallback for older analyses that lack resumeText.
  const fromResume = String(resumeText || '').trimEnd();
  if (fromResume) {
    return fromResume;
  }

  return buildResumeTextFromLineMap(lineMap);
};

export const getScoreTone = (score = 0) => {
  if (score >= 80) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
};

export const getScoreColor = (score = 0) => {
  const tone = getScoreTone(score);
  if (tone === 'good') return '#16a34a';
  if (tone === 'fair') return '#d97706';
  return '#ba1a1a';
};

export const partitionSuggestions = (suggestions = []) => {
  const pending = suggestions.filter((item) => item.status === 'pending');
  const anchored = pending.filter(
    (item) =>
      (item.fieldPath && item.charStart >= 0 && item.charEnd > item.charStart) ||
      (item.charStart >= 0 && item.charEnd > item.charStart)
  );
  const unanchored = pending.filter((item) => !anchored.includes(item));

  return { pending, anchored, unanchored };
};

export const buildAnnotatedHtml = (resumeText = '', suggestions = [], lineMap = []) => {
  const text = String(resumeText || '');
  const { anchored } = partitionSuggestions(suggestions);
  const sorted = [...anchored].sort((left, right) => left.charStart - right.charStart);
  const headingLines = new Set(
    (lineMap || [])
      .filter((line) => line.section_type && line.section_type !== 'contact')
      .map((line) => String(line.text || '').trim().toLowerCase())
      .filter((line) => SECTION_HEADING_RE.test(line))
  );

  const lines = text.split('\n');
  let offset = 0;
  const parts = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const lineHtml = renderTextSegment(line, sorted, offset);
    const normalized = line.trim().toLowerCase();
    const isHeading = isSectionHeadingLine(line) || headingLines.has(normalized);

    if (isHeading) {
      parts.push(
        `<div class="ats-section-heading font-label-md uppercase tracking-wide text-secondary mt-3 mb-1">${lineHtml}</div>`
      );
    } else if (line.length) {
      const isBullet = BULLET_LINE_RE.test(line.trim());
      const lineClass = isBullet ? 'ats-section-line ats-bullet-line pl-3' : 'ats-section-line';
      parts.push(`<div class="${lineClass}">${lineHtml}</div>`);
    } else {
      parts.push('<div class="h-2" aria-hidden="true"></div>');
    }

    offset += line.length + 1;
  }

  if (!parts.length) {
    return renderTextSegment(text, sorted, 0).replace(/\n/g, '<br />');
  }

  return parts.join('');
};

export const extractPlainText = (element) => {
  if (!element) return '';

  const clone = element.cloneNode(true);
  clone.querySelectorAll('[data-ats-chrome="true"], .ats-suggestion-chip').forEach((node) => {
    node.remove();
  });

  // Suggested replacements are display-only until accepted — keep original resume text.
  clone.querySelectorAll('.ats-suggestion').forEach((node) => {
    const originalNode = node.querySelector('.ats-suggestion-original');
    const original = originalNode ? originalNode.textContent || '' : '';
    node.replaceWith(document.createTextNode(original));
  });

  return clone.innerText.replace(/\u00a0/g, ' ').trimEnd();
};

```

### FILE: `frontend/src/features/resumeScanner/utils/structuredResumeUtils.js`

```javascript
export const emptyStructuredResume = () => ({
  name: '',
  contact: { address: '', phone: '', email: '' },
  summary: '',
  workExperience: [],
  education: [],
  skills: [],
  languages: [],
});

export const cloneStructuredResume = (value) => {
  const base = emptyStructuredResume();
  const src = value && typeof value === 'object' ? value : {};
  return {
    name: String(src.name || ''),
    contact: {
      address: String(src.contact?.address || ''),
      phone: String(src.contact?.phone || ''),
      email: String(src.contact?.email || ''),
    },
    summary: String(src.summary || ''),
    workExperience: Array.isArray(src.workExperience)
      ? src.workExperience.map((job) => ({
          title: String(job?.title || ''),
          company: String(job?.company || ''),
          duration: String(job?.duration || ''),
          bullets: Array.isArray(job?.bullets)
            ? job.bullets.map((b) => String(b || '')).filter(Boolean)
            : [],
        }))
      : [],
    education: Array.isArray(src.education)
      ? src.education.map((ed) => ({
          degree: String(ed?.degree || ''),
          institution: String(ed?.institution || ''),
          duration: String(ed?.duration || ''),
        }))
      : [],
    skills: Array.isArray(src.skills) ? src.skills.map((s) => String(s || '')).filter(Boolean) : [],
    languages: Array.isArray(src.languages)
      ? src.languages.map((s) => String(s || '')).filter(Boolean)
      : [],
  };
};

export const hasStructuredResumeData = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  return Boolean(
    data.name ||
      data.contact.email ||
      data.contact.phone ||
      data.summary ||
      data.workExperience.length ||
      data.education.length ||
      data.skills.length ||
      data.languages.length
  );
};

export const getFieldByPath = (obj, path = '') => {
  if (!path) return undefined;
  const parts = String(path).split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    const key = /^\d+$/.test(part) ? Number(part) : part;
    current = current[key];
  }
  return current;
};

export const updateField = (obj, path = '', value) => {
  const clone = cloneStructuredResume(obj);
  const parts = String(path).split('.');
  if (!parts.length || !parts[0]) return clone;

  let current = clone;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const key = /^\d+$/.test(part) ? Number(part) : part;
    const nextPart = parts[i + 1];
    const nextIsIndex = /^\d+$/.test(nextPart);

    if (current[key] == null) {
      current[key] = nextIsIndex ? [] : {};
    }
    current = current[key];
  }

  const last = parts[parts.length - 1];
  const lastKey = /^\d+$/.test(last) ? Number(last) : last;
  current[lastKey] = value;
  return clone;
};

export const generateAtsText = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  const lines = [];

  if (data.name) lines.push(data.name);

  const contactBits = [data.contact.email, data.contact.phone, data.contact.address].filter(Boolean);
  if (contactBits.length) lines.push(contactBits.join(' | '));

  if (data.name || contactBits.length) lines.push('');

  if (data.summary.trim()) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(data.summary.trim());
    lines.push('');
  }

  if (data.workExperience.length) {
    lines.push('WORK EXPERIENCE');
    for (const job of data.workExperience) {
      const header = [job.title, job.company].filter(Boolean).join(', ');
      if (header) lines.push(header);
      if (job.duration) lines.push(job.duration);
      for (const bullet of job.bullets) {
        const cleaned = String(bullet || '').trim();
        if (cleaned) {
          lines.push(cleaned.startsWith('-') || cleaned.startsWith('•') ? cleaned : `• ${cleaned}`);
        }
      }
      lines.push('');
    }
  }

  if (data.education.length) {
    lines.push('EDUCATION');
    for (const ed of data.education) {
      const header = [ed.degree, ed.institution].filter(Boolean).join(', ');
      if (header) lines.push(header);
      if (ed.duration) lines.push(ed.duration);
      lines.push('');
    }
  }

  if (data.skills.length) {
    lines.push('SKILLS');
    lines.push(data.skills.join(', '));
    lines.push('');
  }

  if (data.languages.length) {
    lines.push('LANGUAGES');
    lines.push(data.languages.join(', '));
    lines.push('');
  }

  while (lines.length && !String(lines[lines.length - 1]).trim()) {
    lines.pop();
  }

  return lines.join('\n');
};

/** Map structuredResume → StructuredResumeView props (data only). */
export const structuredResumeToSections = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  const contactLines = [data.contact.email, data.contact.phone, data.contact.address].filter(Boolean);

  const experienceParagraphs = data.workExperience.map((job) => {
    const parts = [];
    const header = [job.title, job.company].filter(Boolean).join(', ');
    if (header) parts.push(header);
    if (job.duration) parts.push(job.duration);
    for (const bullet of job.bullets) {
      const cleaned = String(bullet || '').trim();
      if (cleaned) {
        parts.push(cleaned.startsWith('•') || cleaned.startsWith('-') ? cleaned : `• ${cleaned}`);
      }
    }
    return parts.join('\n');
  });

  const educationParagraphs = data.education.map((ed) => {
    const parts = [];
    const header = [ed.degree, ed.institution].filter(Boolean).join(', ');
    if (header) parts.push(header);
    if (ed.duration) parts.push(ed.duration);
    return parts.join('\n');
  });

  return {
    contact: {
      name: data.name,
      headline: '',
      lines: contactLines,
      text: contactLines.join('\n'),
    },
    summary: {
      text: data.summary,
      paragraphs: data.summary ? [data.summary] : [],
    },
    experience: {
      text: experienceParagraphs.join('\n\n'),
      paragraphs: experienceParagraphs,
    },
    education: {
      text: educationParagraphs.join('\n\n'),
      paragraphs: educationParagraphs,
    },
    skills: {
      text: data.skills.join(', '),
      items: data.skills,
      paragraphs: data.skills.length ? [data.skills.join(', ')] : [],
    },
    additional_sections: data.languages.length
      ? [
          {
            type: 'languages',
            heading: 'LANGUAGES',
            text: data.languages.join(', '),
            paragraphs: [data.languages.join(', ')],
          },
        ]
      : [],
    unassigned: { text: '' },
  };
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const HIGHLIGHT = {
  red: 'line-through text-[#991b1b] bg-[#fee2e2] px-0.5 rounded-sm',
  green: 'text-[#166534] bg-[#dcfce7] px-0.5 rounded-sm font-medium',
  missing: 'text-[#ef4444] border-b-2 border-[#ef4444]',
};

/** Annotate a single field value with suggestions targeting that fieldPath. */
export const annotateFieldHtml = (text = '', fieldPath = '', suggestions = [], suggestionsEnabled = true) => {
  const value = String(text || '');
  if (!suggestionsEnabled || !value) return escapeHtml(value);

  const relevant = suggestions.filter(
    (s) =>
      s.status === 'pending' &&
      s.fieldPath === fieldPath &&
      s.charStart >= 0 &&
      s.charEnd > s.charStart
  );

  if (!relevant.length) return escapeHtml(value);

  const sorted = [...relevant].sort((a, b) => a.charStart - b.charStart);
  let cursor = 0;
  const parts = [];

  for (const suggestion of sorted) {
    const start = Math.max(0, suggestion.charStart);
    const end = Math.min(value.length, suggestion.charEnd);
    if (end <= start || start < cursor) continue;

    if (start > cursor) parts.push(escapeHtml(value.slice(cursor, start)));

    const originalText = value.slice(start, end) || suggestion.original || '';
    const suggestedText = suggestion.suggested || '';
    let inner = '';

    if (suggestion.type === 'remove' || !suggestedText) {
      inner = `<span class="ats-suggestion-original ${HIGHLIGHT.red}">${escapeHtml(originalText)}</span>`;
    } else if (suggestion.type === 'missing_keyword') {
      if (originalText) {
        inner += `<span class="ats-suggestion-original ${HIGHLIGHT.missing}">${escapeHtml(originalText)}</span>`;
      }
      if (suggestedText) {
        inner += `<span class="ats-suggestion-replacement ${HIGHLIGHT.green}">${originalText ? ' ' : ''}${escapeHtml(suggestedText)}</span>`;
      }
    } else {
      inner = `<span class="ats-suggestion-original ${HIGHLIGHT.red}">${escapeHtml(originalText)}</span> <span class="ats-suggestion-replacement ${HIGHLIGHT.green}">${escapeHtml(suggestedText)}</span>`;
    }

    parts.push(
      `<span contenteditable="false" class="ats-suggestion cursor-pointer suggestion-trigger" data-suggestion-id="${escapeHtml(suggestion.id)}" role="button" tabindex="0">${inner}</span>`
    );
    cursor = end;
  }

  if (cursor < value.length) parts.push(escapeHtml(value.slice(cursor)));
  return parts.join('');
};

```

## 4. FRONTEND — i18n

### FILE: `frontend/src/i18n/locales/en/resumeScanner.json`

```json
{
  "page": {
    "upload": {
      "title": "AI Optimize",
      "description": "Analyze your resume against any job description, identify ATS issues, optimize keywords, and improve your chances of getting shortlisted."
    },
    "analysisPlaceholder": {
      "title": "Resume Scanner Analysis",
      "description": "Your analysis is ready. The full ATS workspace is loading next.",
      "scoreLabel": "ATS Score",
      "loading": "Loading analysis...",
      "backToUpload": "Back to upload"
    }
  },
  "upload": {
    "step1Title": "Step 1: Select Resume",
    "step2Title": "Step 2: Paste Job Description",
    "tabs": {
      "uploadNew": "Upload New"
    },
    "dropzoneTitle": "Drag & drop your resume",
    "dropzoneHint": "or click to browse files",
    "formats": {
      "pdf": "PDF",
      "docx": "DOCX",
      "maxSize": "Max 10MB"
    },
    "selectedFile": "Selected: {{name}}",
    "changeFile": "Change file",
    "jobDescriptionPlaceholder": "Paste the full job description here. The AI will extract key skills, requirements, and responsibilities to compare against your resume...",
    "clearText": "Clear Text",
    "pasteHint": "Paste from clipboard",
    "poweredBy": "Powered by CareerBridge AI",
    "analyze": "Analyze Resume",
    "errors": {
      "fileRequired": "Please upload a resume file.",
      "fileTooLarge": "Resume file must be 10MB or smaller.",
      "unsupportedFile": "Unsupported file type. Use PDF or DOCX.",
      "jobDescriptionRequired": "Please paste a job description.",
      "analyzeFailed": "Could not start resume analysis. Please try again."
    }
  },
  "overlay": {
    "processing": "AI Processing...",
    "queued": "Queued for analysis...",
    "extracting": "Extracting resume content...",
    "analyzing": "Analyzing skills and ATS fit...",
    "complete": "Skills Extracted Successfully",
    "failed": "Analysis failed",
    "progressComplete": "{{progress}}% Complete",
    "labels": {
      "skills": "Skills",
      "experience": "Experience",
      "education": "Education"
    }
  },
  "analysis": {
    "loading": "Loading analysis...",
    "backToUpload": "Back to upload",
    "defaultJobTitle": "Resume Analysis",
    "headerDescription": "Review suggestions and improve your resume for this role.",
    "headerDescriptionWithCompany": "Optimize your resume for {{company}}.",
    "gauge": {
      "jobMatchLabel": "Job Match Score",
      "atsLabel": "ATS Parse Score",
      "atsHint": "How well ATS systems can read your resume (formatting & structure)."
    },
    "atsTipBadge": "✨ ATS tip",
    "tabs": {
      "skills": "Skills",
      "searchability": "Searchability",
      "recruiterTips": "Recruiter Tips"
    },
    "workspaceTabs": {
      "resume": "Resume",
      "coverLetter": "Cover Letter",
      "jobDescription": "Job Description"
    },
    "workspaceEmpty": {
      "coverLetter": "No cover letter was generated for this analysis.",
      "jobDescription": "No job description text is available."
    },
    "skills": {
      "matched": "Matched skills",
      "missing": "Missing skills",
      "noMatched": "No matched skills yet.",
      "noMissing": "All tracked skills are matched.",
      "hardSkills": "Hard skills",
      "requiredSkills": "Required skills",
      "matchedLabel": "Matched skills",
      "missingLabel": "Missing skills",
      "matchedPlain": "Matched skills {{count}}",
      "missingPlain": "Missing skills {{count}}",
      "aiSuggestedPerSkill": "AI Suggested {{accepted}}/{{total}}",
      "requiredInfo": "Must-have skills called out in the job description.",
      "hardInfo": "Technical and role-specific skills from the job description.",
      "emptyCategory": "No skills in this category."
    },
    "searchability": {
      "sectionCompleteness": "Section completeness",
      "searchability": "Searchability",
      "quantifiedAchievements": "Quantified achievements",
      "issues": "Issues to fix",
      "noIssues": "No searchability issues detected."
    },
    "recruiterTips": {
      "empty": "No recruiter tips for this analysis."
    },
    "steps": {
      "ariaLabel": "Analysis steps",
      "suggestions": "AI Suggestions ({{count}} pending)",
      "suggestionsProgress": "AI Suggestions ({{accepted}}/{{total}})",
      "edit": "Edit"
    },
    "editor": {
      "title": "Resume",
      "ariaLabel": "Editable resume text",
      "saving": "Saving...",
      "hint": "{{count}} pending suggestion(s). Click highlighted text to review.",
      "editHint": "Edit your resume freely. Changes save automatically.",
      "unanchoredTitle": "Suggestions without an exact match (review in popover only)"
    },
    "popover": {
      "title": "AI Suggestion",
      "close": "Close",
      "original": "Original",
      "suggested": "Suggested",
      "currentText": "Current Text",
      "suggestedChange": "Suggested Change",
      "removeText": "(Remove Text)",
      "impact": "+{{points}} pts potential impact",
      "impactShort": "+{{points}} Score",
      "accept": "Accept Change",
      "reject": "Reject"
    },
    "suggestionTypes": {
      "missing_keyword": "Missing keyword",
      "reword": "Reword",
      "remove": "Remove"
    },
    "toolbar": {
      "accepted": "{{accepted}} / {{total}} accepted",
      "pending": "{{count}} pending",
      "undo": "Undo",
      "redo": "Redo",
      "acceptAll": "Accept All",
      "continueToEdit": "Continue",
      "newAnalysis": "New Analysis",
      "continue": "Continue"
    },
    "toasts": {
      "acceptAllSuccess": "All suggestions accepted."
    },
    "errors": {
      "suggestionFailed": "Could not update suggestion.",
      "textFailed": "Could not save resume text.",
      "acceptAllFailed": "Could not accept all suggestions.",
      "undoFailed": "Nothing to undo.",
      "redoFailed": "Nothing to redo."
    }
  }
}

```

### FILE: `frontend/src/i18n/locales/es/resumeScanner.json`

```json
{
  "page": {
    "upload": {
      "title": "Optimización con IA",
      "description": "Analiza tu currículum frente a cualquier descripción del puesto, detecta problemas ATS, optimiza palabras clave y mejora tus posibilidades de ser preseleccionado."
    },
    "analysisPlaceholder": {
      "title": "Análisis del escáner de currículum",
      "description": "Tu análisis está listo. El espacio de trabajo ATS completo se cargará a continuación.",
      "scoreLabel": "Puntuación ATS",
      "loading": "Cargando análisis...",
      "backToUpload": "Volver a subir"
    }
  },
  "upload": {
    "step1Title": "Paso 1: Seleccionar currículum",
    "step2Title": "Paso 2: Pegar descripción del puesto",
    "tabs": {
      "uploadNew": "Subir nuevo"
    },
    "dropzoneTitle": "Arrastra y suelta tu currículum",
    "dropzoneHint": "o haz clic para buscar archivos",
    "formats": {
      "pdf": "PDF",
      "docx": "DOCX",
      "maxSize": "Máx. 10 MB"
    },
    "selectedFile": "Seleccionado: {{name}}",
    "changeFile": "Cambiar archivo",
    "jobDescriptionPlaceholder": "Pega aquí la descripción completa del puesto. La IA extraerá habilidades, requisitos y responsabilidades clave para compararlos con tu currículum...",
    "clearText": "Borrar texto",
    "pasteHint": "Pegar desde el portapapeles",
    "poweredBy": "Impulsado por CareerBridge AI",
    "analyze": "Analizar currículum",
    "errors": {
      "fileRequired": "Sube un archivo de currículum.",
      "fileTooLarge": "El archivo debe ser de 10 MB o menos.",
      "unsupportedFile": "Tipo de archivo no compatible. Usa PDF o DOCX.",
      "jobDescriptionRequired": "Pega una descripción del puesto.",
      "analyzeFailed": "No se pudo iniciar el análisis. Inténtalo de nuevo."
    }
  },
  "overlay": {
    "processing": "Procesando con IA...",
    "queued": "En cola para análisis...",
    "extracting": "Extrayendo contenido del currículum...",
    "analyzing": "Analizando habilidades y ajuste ATS...",
    "complete": "Habilidades extraídas correctamente",
    "failed": "El análisis falló",
    "progressComplete": "{{progress}}% completado",
    "labels": {
      "skills": "Habilidades",
      "experience": "Experiencia",
      "education": "Educación"
    }
  },
  "analysis": {
    "loading": "Cargando análisis...",
    "backToUpload": "Volver a subir",
    "defaultJobTitle": "Análisis de currículum",
    "headerDescription": "Revisa sugerencias y mejora tu currículum para este puesto.",
    "headerDescriptionWithCompany": "Optimiza tu currículum para {{company}}.",
    "gauge": {
      "jobMatchLabel": "Puntuación de ajuste",
      "atsLabel": "Puntuación ATS",
      "atsHint": "Qué tan bien los sistemas ATS pueden leer tu currículum (formato y estructura)."
    },
    "atsTipBadge": "✨ Consejo ATS",
    "tabs": {
      "skills": "Habilidades",
      "searchability": "Buscabilidad",
      "recruiterTips": "Consejos"
    },
    "workspaceTabs": {
      "resume": "Currículum",
      "coverLetter": "Carta de presentación",
      "jobDescription": "Descripción del puesto"
    },
    "workspaceEmpty": {
      "coverLetter": "No se generó una carta de presentación para este análisis.",
      "jobDescription": "No hay texto de descripción del puesto disponible."
    },
    "skills": {
      "matched": "Habilidades coincidentes",
      "missing": "Habilidades faltantes",
      "noMatched": "Aún no hay habilidades coincidentes.",
      "noMissing": "Todas las habilidades rastreadas coinciden.",
      "hardSkills": "Habilidades técnicas",
      "requiredSkills": "Habilidades requeridas",
      "matchedLabel": "Coincidentes",
      "missingLabel": "Faltantes",
      "matchedPlain": "Coincidentes {{count}}",
      "missingPlain": "Faltantes {{count}}",
      "aiSuggestedPerSkill": "IA sugerida {{accepted}}/{{total}}",
      "requiredInfo": "Habilidades imprescindibles de la descripción del puesto.",
      "hardInfo": "Habilidades técnicas específicas del rol.",
      "emptyCategory": "No hay habilidades en esta categoría."
    },
    "searchability": {
      "sectionCompleteness": "Completitud de secciones",
      "searchability": "Buscabilidad",
      "quantifiedAchievements": "Logros cuantificados",
      "issues": "Problemas a corregir",
      "noIssues": "No se detectaron problemas de buscabilidad."
    },
    "recruiterTips": {
      "empty": "No hay consejos de reclutador para este análisis."
    },
    "steps": {
      "ariaLabel": "Pasos del análisis",
      "suggestions": "Sugerencias IA ({{count}} pendientes)",
      "suggestionsProgress": "Sugerencias IA ({{accepted}}/{{total}})",
      "edit": "Editar"
    },
    "editor": {
      "title": "Currículum",
      "ariaLabel": "Texto editable del currículum",
      "saving": "Guardando...",
      "hint": "{{count}} sugerencia(s) pendiente(s). Haz clic en el texto resaltado para revisar.",
      "editHint": "Edita tu currículum libremente. Los cambios se guardan automáticamente.",
      "unanchoredTitle": "Sugerencias sin coincidencia exacta (solo en el popover)"
    },
    "popover": {
      "title": "Sugerencia IA",
      "close": "Cerrar",
      "original": "Original",
      "suggested": "Sugerido",
      "currentText": "Texto actual",
      "suggestedChange": "Cambio sugerido",
      "removeText": "(Eliminar texto)",
      "impact": "+{{points}} pts de impacto potencial",
      "impactShort": "+{{points}} Score",
      "accept": "Aceptar cambio",
      "reject": "Rechazar"
    },
    "suggestionTypes": {
      "missing_keyword": "Palabra clave faltante",
      "reword": "Reformular",
      "remove": "Eliminar"
    },
    "toolbar": {
      "accepted": "{{accepted}} / {{total}} aceptadas",
      "pending": "{{count}} pendientes",
      "undo": "Deshacer",
      "redo": "Rehacer",
      "acceptAll": "Aceptar todas",
      "continueToEdit": "Continuar",
      "newAnalysis": "Nuevo análisis",
      "continue": "Continuar"
    },
    "toasts": {
      "acceptAllSuccess": "Todas las sugerencias fueron aceptadas."
    },
    "errors": {
      "suggestionFailed": "No se pudo actualizar la sugerencia.",
      "textFailed": "No se pudo guardar el texto del currículum.",
      "acceptAllFailed": "No se pudieron aceptar todas las sugerencias.",
      "undoFailed": "Nada que deshacer.",
      "redoFailed": "Nada que rehacer."
    }
  }
}

```

### FILE: `frontend/src/i18n/locales/ur/resumeScanner.json`

```json
{
  "page": {
    "upload": {
      "title": "AI سے بہتر بنائیں",
      "description": "کسی بھی نوکری کی تفصیل کے خلاف اپنے ریزیومے کا تجزیہ کریں، ATS مسائل پہچانیں، کلیدی الفاظ بہتر بنائیں، اور شارٹ لسٹ ہونے کے امکانات بڑھائیں۔"
    },
    "analysisPlaceholder": {
      "title": "ریزیومے اسکینر تجزیہ",
      "description": "آپ کا تجزیہ تیار ہے۔ مکمل ATS ورک اسپیس اگلے مرحلے میں لوڈ ہوگا۔",
      "scoreLabel": "ATS سکور",
      "loading": "تجزیہ لوڈ ہو رہا ہے...",
      "backToUpload": "اپ لوڈ پر واپس"
    }
  },
  "upload": {
    "step1Title": "مرحلہ 1: ریزیومے منتخب کریں",
    "step2Title": "مرحلہ 2: نوکری کی تفصیل پیسٹ کریں",
    "tabs": {
      "uploadNew": "نیا اپ لوڈ"
    },
    "dropzoneTitle": "اپنا ریزیومے ڈریگ اور ڈراپ کریں",
    "dropzoneHint": "یا فائلیں براؤز کرنے کے لیے کلک کریں",
    "formats": {
      "pdf": "PDF",
      "docx": "DOCX",
      "maxSize": "زیادہ سے زیادہ 10MB"
    },
    "selectedFile": "منتخب: {{name}}",
    "changeFile": "فائل بدلیں",
    "jobDescriptionPlaceholder": "مکمل نوکری کی تفصیل یہاں پیسٹ کریں۔ AI کلیدی مہارتیں، ضروریات اور ذمہ داریاں نکال کر آپ کے ریزیومے سے موازنہ کرے گا...",
    "clearText": "متن صاف کریں",
    "pasteHint": "کلپ بورڈ سے پیسٹ کریں",
    "poweredBy": "CareerBridge AI کے ذریعے",
    "analyze": "ریزیومے کا تجزیہ کریں",
    "errors": {
      "fileRequired": "براہ کرم ریزیومے فائل اپ لوڈ کریں۔",
      "fileTooLarge": "ریزیومے فائل 10MB یا اس سے چھوٹی ہونی چاہیے۔",
      "unsupportedFile": "غیر معاون فائل کی قسم۔ PDF یا DOCX استعمال کریں۔",
      "jobDescriptionRequired": "براہ کرم نوکری کی تفصیل پیسٹ کریں۔",
      "analyzeFailed": "ریزیومے تجزیہ شروع نہیں ہو سکا۔ دوبارہ کوشش کریں۔"
    }
  },
  "overlay": {
    "processing": "AI پروسیسنگ...",
    "queued": "تجزیہ کی قطار میں...",
    "extracting": "ریزیومے مواد نکالا جا رہا ہے...",
    "analyzing": "مہارتیں اور ATS موازنہ کیا جا رہا ہے...",
    "complete": "مہارتیں کامیابی سے نکالی گئیں",
    "failed": "تجزیہ ناکام ہوا",
    "progressComplete": "{{progress}}% مکمل",
    "labels": {
      "skills": "مہارتیں",
      "experience": "تجربہ",
      "education": "تعلیم"
    }
  },
  "analysis": {
    "loading": "تجزیہ لوڈ ہو رہا ہے...",
    "backToUpload": "اپ لوڈ پر واپس",
    "defaultJobTitle": "ریزیومے تجزیہ",
    "headerDescription": "تجاویز دیکھیں اور اس کردار کے لیے اپنا ریزیومے بہتر بنائیں۔",
    "headerDescriptionWithCompany": "{{company}} کے لیے اپنا ریزیومے بہتر بنائیں۔",
    "gauge": {
      "jobMatchLabel": "نوکری میچ سکور",
      "atsLabel": "ATS پارس سکور",
      "atsHint": "ATS سسٹمز آپ کا ریزیومے کتنی اچھی طرح پڑھ سکتے ہیں (فارمیٹنگ اور ساخت)۔"
    },
    "atsTipBadge": "✨ ATS مشورہ",
    "tabs": {
      "skills": "مہارتیں",
      "searchability": "تلاش کی اہلیت",
      "recruiterTips": "بھرتی کنندہ کے مشورے"
    },
    "workspaceTabs": {
      "resume": "ریزیومے",
      "coverLetter": "کور لیٹر",
      "jobDescription": "جاب ڈسکرپشن"
    },
    "workspaceEmpty": {
      "coverLetter": "اس تجزیے کے لیے کوئی کور لیٹر نہیں بنا۔",
      "jobDescription": "جاب ڈسکرپشن دستیاب نہیں۔"
    },
    "skills": {
      "matched": "مماثل مہارتیں",
      "missing": "غائب مہارتیں",
      "noMatched": "ابھی کوئی مماثل مہارت نہیں۔",
      "noMissing": "تمام ٹریک شدہ مہارتیں مماثل ہیں۔",
      "hardSkills": "ٹیکنیکل مہارتیں",
      "requiredSkills": "ضروری مہارتیں",
      "matchedLabel": "مماثل مہارتیں",
      "missingLabel": "غائب مہارتیں",
      "matchedPlain": "مماثل مہارتیں {{count}}",
      "missingPlain": "غائب مہارتیں {{count}}",
      "aiSuggestedPerSkill": "AI تجاویز {{accepted}}/{{total}}",
      "requiredInfo": "جاب ڈسکرپشن میں بیان کردہ لازمی مہارتیں۔",
      "hardInfo": "رول سے متعلق ٹیکنیکل مہارتیں۔",
      "emptyCategory": "اس زمرے میں کوئی مہارت نہیں۔"
    },
    "searchability": {
      "sectionCompleteness": "سیکشن مکملیت",
      "searchability": "تلاش کی اہلیت",
      "quantifiedAchievements": "مقداری کامیابیاں",
      "issues": "درست کرنے والے مسائل",
      "noIssues": "کوئی تلاشی مسئلہ نہیں ملا۔"
    },
    "recruiterTips": {
      "empty": "اس تجزیے کے لیے کوئی بھرتی مشورے نہیں۔"
    },
    "steps": {
      "ariaLabel": "تجزیہ کے مراحل",
      "suggestions": "AI تجاویز ({{count}} زیر التواء)",
      "edit": "ترمیم",
      "suggestionsProgress": "AI تجاویز ({{accepted}}/{{total}})"
    },
    "editor": {
      "title": "ریزیومے",
      "ariaLabel": "قابل ترمیم ریزیومے متن",
      "saving": "محفوظ ہو رہا ہے...",
      "hint": "{{count}} زیر التواء تجویز(یں)۔ جائزہ کے لیے نمایاں متن پر کلک کریں۔",
      "editHint": "اپنا ریزیومے آزادانہ ترمیم کریں۔ تبدیلیاں خود بخود محفوظ ہوتی ہیں۔",
      "unanchoredTitle": "بغیر عین مماثلت کی تجاویز (صرف پوپ اوور میں)"
    },
    "popover": {
      "title": "AI تجویز",
      "close": "بند کریں",
      "original": "اصل",
      "suggested": "تجویز کردہ",
      "currentText": "موجودہ متن",
      "suggestedChange": "تجویز کردہ تبدیلی",
      "removeText": "(متن ہٹائیں)",
      "impact": "+{{points}} ممکنہ اثر پوائنٹس",
      "impactShort": "+{{points}} Score",
      "accept": "تبدیلی قبول کریں",
      "reject": "مسترد"
    },
    "suggestionTypes": {
      "missing_keyword": "غائب کلیدی لفظ",
      "reword": "دوبارہ لکھیں",
      "remove": "ہٹائیں"
    },
    "toolbar": {
      "accepted": "{{accepted}} / {{total}} قبول",
      "pending": "{{count}} زیر التواء",
      "undo": "واپس",
      "redo": "دوبارہ",
      "acceptAll": "سب قبول کریں",
      "continueToEdit": "جاری رکھیں",
      "newAnalysis": "نیا تجزیہ",
      "continue": "جاری رکھیں"
    },
    "toasts": {
      "acceptAllSuccess": "تمام تجاویز قبول ہو گئیں۔"
    },
    "errors": {
      "suggestionFailed": "تجویز اپ ڈیٹ نہیں ہو سکی۔",
      "textFailed": "ریزیومے متن محفوظ نہیں ہو سکا۔",
      "acceptAllFailed": "تمام تجاویز قبول نہیں ہو سکیں۔",
      "undoFailed": "واپس کرنے کے لیے کچھ نہیں۔",
      "redoFailed": "دوبارہ کرنے کے لیے کچھ نہیں۔"
    }
  }
}

```

## 5. FRONTEND — App Routes

### FILE: `frontend/src/App.jsx`

```jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailSent from './pages/VerifyEmailSent';
import SocialAuthCallback from './pages/SocialAuthCallback';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings/Settings';
import PersonalInformation from './pages/Settings/PersonalInformation';
import LoginSecurity from './pages/Settings/LoginSecurity';
import AppearanceSettings from './pages/Settings/AppearanceSettings';
import AccountManagement from './pages/Settings/AccountManagement';
import InterviewPrepPage from './pages/InterviewPrep/InterviewPrepPage';
import SkillAssessmentSetupPage from './pages/InterviewPrep/SkillAssessmentSetupPage';
import MockInterviewLayout from './pages/InterviewPrep/MockInterviewLayout';
import MockInterviewSetupPage from './pages/InterviewPrep/MockInterviewSetupPage';
import MockInterviewSessionPage from './pages/InterviewPrep/MockInterviewSessionPage';
import SkillAssessmentQuizPage from './pages/InterviewPrep/SkillAssessmentQuizPage';
import UploadResumePage from './pages/ResumeBuilder/UploadResumePage';
import ResumeEditorPage from './pages/ResumeBuilder/ResumeEditorPage';
import ResumeHistoryPage from './pages/ResumeBuilder/ResumeHistoryPage';
import ResumeDetailsPage from './pages/ResumeBuilder/ResumeDetailsPage';
import ResumeScannerUploadPage from './pages/ResumeScanner/ResumeScannerUploadPage';
import ResumeScannerAnalysisPage from './pages/ResumeScanner/ResumeScannerAnalysisPage';
import HeroResumeCapture from './pages/dev/HeroResumeCapture';
import GuestRoute from './components/auth/GuestRoute';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/dev/hero-resume-capture" element={<HeroResumeCapture />} />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        }
      />
      <Route
        path="/verify-email"
        element={
          <GuestRoute>
            <VerifyEmail />
          </GuestRoute>
        }
      />
      <Route
        path="/verify-email-sent"
        element={
          <GuestRoute>
            <VerifyEmailSent />
          </GuestRoute>
        }
      />
      <Route path="/auth/social/callback" element={<SocialAuthCallback />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview-prep"
        element={
          <ProtectedRoute>
            <InterviewPrepPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview-prep/skills"
        element={
          <ProtectedRoute>
            <SkillAssessmentSetupPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/interview-prep/mock"
        element={
          <ProtectedRoute>
            <MockInterviewLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MockInterviewSetupPage />} />
        <Route path=":sessionId" element={<MockInterviewSessionPage />} />
      </Route>
      <Route
        path="/interview-prep/skills/:quizId"
        element={
          <ProtectedRoute>
            <SkillAssessmentQuizPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/upload"
        element={
          <ProtectedRoute>
            <UploadResumePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/history"
        element={
          <ProtectedRoute>
            <ResumeHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/templates"
        element={
          <ProtectedRoute>
            <Navigate to="/resume/upload" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/scanner"
        element={
          <ProtectedRoute>
            <ResumeScannerUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-scanner"
        element={
          <ProtectedRoute>
            <ResumeScannerUploadPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume-scanner/:analysisId"
        element={
          <ProtectedRoute>
            <ResumeScannerAnalysisPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/:id/edit"
        element={
          <ProtectedRoute>
            <ResumeEditorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resume/:id"
        element={
          <ProtectedRoute>
            <ResumeDetailsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/personal-information"
        element={
          <ProtectedRoute>
            <PersonalInformation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/login-security"
        element={
          <ProtectedRoute>
            <LoginSecurity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/privacy"
        element={
          <ProtectedRoute>
            <Navigate to="/settings" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/appearance"
        element={
          <ProtectedRoute>
            <AppearanceSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/notifications"
        element={
          <ProtectedRoute>
            <Navigate to="/settings" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/account-management"
        element={
          <ProtectedRoute>
            <AccountManagement />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;

```

## 6. BACKEND — Routes & Controller

### FILE: `backend/src/routes/resumeScannerRoutes.js`

```javascript
import express from 'express';
import {
  acceptAllSuggestions,
  getResumeScannerAnalysis,
  getResumeScannerStatus,
  redoResumeScannerChange,
  undoResumeScannerChange,
  updateResumeScannerText,
  updateSuggestionStatus,
  uploadAndAnalyzeResume,
} from '../controllers/resumeScannerController.js';
import { protect } from '../middleware/authMiddleware.js';
import { handleResumeScannerUpload } from '../middleware/resumeScannerUploadMiddleware.js';
import {
  resumeScannerHeavyLimiter,
  resumeScannerTextLimiter,
} from '../middleware/resumeScannerRateLimiters.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  analysisIdValidation,
  suggestionActionValidation,
  updateResumeTextValidation,
  uploadResumeScannerValidation,
} from '../validators/resumeScannerValidators.js';

const router = express.Router();

router.post(
  '/resume-scanner/upload',
  protect,
  resumeScannerHeavyLimiter,
  handleResumeScannerUpload,
  uploadResumeScannerValidation,
  validateRequest,
  uploadAndAnalyzeResume
);

router.get(
  '/resume-scanner/:analysisId/status',
  protect,
  analysisIdValidation,
  validateRequest,
  getResumeScannerStatus
);

router.get(
  '/resume-scanner/:analysisId',
  protect,
  analysisIdValidation,
  validateRequest,
  getResumeScannerAnalysis
);

router.patch(
  '/resume-scanner/:analysisId/suggestion/:suggestionId',
  protect,
  resumeScannerTextLimiter,
  suggestionActionValidation,
  validateRequest,
  updateSuggestionStatus
);

router.post(
  '/resume-scanner/:analysisId/accept-all',
  protect,
  resumeScannerTextLimiter,
  analysisIdValidation,
  validateRequest,
  acceptAllSuggestions
);

router.patch(
  '/resume-scanner/:analysisId/text',
  protect,
  resumeScannerTextLimiter,
  updateResumeTextValidation,
  validateRequest,
  updateResumeScannerText
);

router.post(
  '/resume-scanner/:analysisId/undo',
  protect,
  resumeScannerTextLimiter,
  analysisIdValidation,
  validateRequest,
  undoResumeScannerChange
);

router.post(
  '/resume-scanner/:analysisId/redo',
  protect,
  resumeScannerTextLimiter,
  analysisIdValidation,
  validateRequest,
  redoResumeScannerChange
);

export default router;

```

### FILE: `backend/src/controllers/resumeScannerController.js`

```javascript
import AtsAnalysis from '../models/AtsAnalysis.js';
import JobDescription from '../models/JobDescription.js';
import ScannedResume from '../models/ScannedResume.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { resolveCanonicalResumeText } from '../utils/resumeLineMapUtils.js';
import { analyzeResumeAgainstJob, recomputeAnalysisState } from '../utils/resumeScannerAiService.js';
import { extractResumeForScanner } from '../utils/resumeScannerExtractionService.js';
import {
  canRedo,
  canUndo,
  initializeHistory,
  pushHistoryEntry,
  redoAnalysis,
  undoAnalysis,
} from '../utils/resumeScannerHistory.js';
import { computeSkillMatches } from '../utils/resumeScannerScoring.js';
import { serializeAtsAnalysis } from '../utils/resumeScannerSerializer.js';
import {
  applySuggestionToStructured,
  cloneStructuredResume,
  generateAtsText,
  hasStructuredResumeData,
  parseAtsTextToStructured,
  setFieldByPath,
  structuredResumeToSections,
} from '../utils/structuredResume.js';
import { sanitizeResumeScannerText } from '../utils/resumeScannerTextUtils.js';
import { AppError, sendResponse } from '../utils/sendResponse.js';

const runningJobs = new Set();

const ensureStructuredResume = (analysis) => {
  if (hasStructuredResumeData(analysis.structuredResume)) {
    return cloneStructuredResume(analysis.structuredResume);
  }
  return parseAtsTextToStructured(analysis.resumeText || '');
};

const syncDerivedFromStructured = (analysis, structuredResume) => {
  const structured = cloneStructuredResume(structuredResume);
  analysis.structuredResume = structured;
  analysis.resumeText = generateAtsText(structured);
  analysis.structuredSections = structuredResumeToSections(structured);
  analysis.lineMap = [];
  analysis.markModified('structuredResume');
  analysis.markModified('structuredSections');
  analysis.markModified('lineMap');
};

const applyRecomputedState = (analysis, recomputed) => {
  analysis.resumeText = recomputed.resumeText;
  analysis.structuredResume = cloneStructuredResume(recomputed.structuredResume);
  analysis.structuredSections = recomputed.structuredSections;
  analysis.lineMap = [];
  analysis.atsScore = recomputed.atsScore;
  analysis.jobMatchScore = recomputed.jobMatchScore;
  analysis.score = recomputed.jobMatchScore;
  analysis.atsScoreBreakdown = recomputed.atsScoreBreakdown;
  analysis.jobMatchBreakdown = recomputed.jobMatchBreakdown;
  analysis.suggestions = recomputed.suggestions;
  analysis.markModified('structuredResume');
  analysis.markModified('structuredSections');
  analysis.markModified('lineMap');
};

const loadAnalysisForUser = async (analysisId, userId) => {
  const analysis = await AtsAnalysis.findOne({ _id: analysisId, userId });

  if (!analysis) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_FOUND, 404);
  }

  return analysis;
};

const loadJobDescription = async (jobDescriptionId, userId) => {
  const jobDescription = await JobDescription.findOne({ _id: jobDescriptionId, userId });
  if (!jobDescription) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_FOUND, 404);
  }
  return jobDescription;
};

const updateAnalysisProgress = async (analysisId, { status, progress, statusMessage, errorMessage }) => {
  await AtsAnalysis.findByIdAndUpdate(analysisId, {
    ...(status ? { status } : {}),
    ...(typeof progress === 'number' ? { progress } : {}),
    ...(statusMessage !== undefined ? { statusMessage } : {}),
    ...(errorMessage !== undefined ? { errorMessage } : {}),
  });
};

const resolveResumeSource = async ({ userId, file }) => {
  if (!file) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.FILE_REQUIRED, 400);
  }

  const extraction = await extractResumeForScanner(file);
  const scannedResume = await ScannedResume.create({
    userId,
    label: extraction.sourceFile?.filename || 'Uploaded Resume',
    sourceFile: extraction.sourceFile,
    extractedText: extraction.extractedText,
    structuredSections: extraction.structuredSections,
    lineMap: extraction.lineMap,
    extractionMetadata: extraction.extractionMetadata,
  });

  return {
    resumeSourceType: 'scanned',
    resumeSourceId: scannedResume._id,
    extractedText: extraction.extractedText,
    structuredSections: extraction.structuredSections,
    lineMap: extraction.lineMap,
    sourceFile: extraction.sourceFile,
  };
};

const runAnalysisPipeline = async (analysisId, userId) => {
  if (runningJobs.has(String(analysisId))) {
    return;
  }

  runningJobs.add(String(analysisId));

  try {
    const analysis = await loadAnalysisForUser(analysisId, userId);
    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, userId);

    await updateAnalysisProgress(analysisId, {
      status: 'extracting',
      progress: 20,
      statusMessage: 'Preparing resume text...',
    });

    const resumeText = sanitizeResumeScannerText(
      resolveCanonicalResumeText({
        resumeText: analysis.resumeText,
        lineMap: analysis.lineMap,
      })
    );
    if (!resumeText) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
    }

    const structuredResume = ensureStructuredResume({
      ...analysis.toObject(),
      resumeText,
    });
    const derivedText = generateAtsText(structuredResume);

    await updateAnalysisProgress(analysisId, {
      status: 'analyzing',
      progress: 45,
      statusMessage: 'Extracting skills from job description...',
    });

    const aiResult = await analyzeResumeAgainstJob({
      resumeText: derivedText || resumeText,
      jobDescriptionText: jobDescription.rawText,
      jobTitle: jobDescription.title || '',
      structuredSections: structuredResumeToSections(structuredResume),
      structuredResume,
    });

    await updateAnalysisProgress(analysisId, {
      progress: 80,
      statusMessage: 'Generating ATS suggestions...',
    });

    jobDescription.title = aiResult.jobTitle || jobDescription.title;
    jobDescription.company = aiResult.company || jobDescription.company;
    jobDescription.extractedSkills = aiResult.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      type: skill.type,
      synonyms: skill.synonyms || [],
    }));
    await jobDescription.save();

    analysis.status = 'completed';
    analysis.progress = 100;
    analysis.statusMessage = 'Analysis complete';
    analysis.score = aiResult.jobMatchScore;
    analysis.atsScore = aiResult.atsScore;
    analysis.jobMatchScore = aiResult.jobMatchScore;
    analysis.atsScoreBreakdown = aiResult.atsScoreBreakdown;
    analysis.jobMatchBreakdown = aiResult.jobMatchBreakdown;
    analysis.matchedSkillIds = aiResult.matchedSkillIds;
    analysis.missingSkillIds = aiResult.missingSkillIds;
    analysis.suggestions = aiResult.suggestions;
    analysis.searchabilityIssues = aiResult.searchabilityIssues;
    analysis.recruiterTips = aiResult.recruiterTips;
    syncDerivedFromStructured(analysis, aiResult.structuredResume || structuredResume);
    analysis.originalResumeText = analysis.resumeText;
    initializeHistory(analysis);
    await analysis.save();
  } catch (error) {
    console.error('[resume-scanner] Analysis pipeline failed:', error);
    await updateAnalysisProgress(analysisId, {
      status: 'failed',
      progress: 100,
      statusMessage: 'Analysis failed',
      errorMessage: error.message || 'Analysis failed',
    });
  } finally {
    runningJobs.delete(String(analysisId));
  }
};

const refreshSkillState = (analysis, jobDescription) => {
  const resumeText = resolveCanonicalResumeText({
    resumeText: analysis.resumeText,
    lineMap: analysis.lineMap,
  });
  const skillMatch = computeSkillMatches(resumeText, jobDescription.extractedSkills);
  analysis.matchedSkillIds = skillMatch.matchedSkillIds;
  analysis.missingSkillIds = skillMatch.missingSkillIds;
};

export const uploadAndAnalyzeResume = async (req, res, next) => {
  try {
    const jobDescriptionText = sanitizeResumeScannerText(req.body.jobDescription);

    if (!jobDescriptionText) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED, 400);
    }

    const resumeSource = await resolveResumeSource({
      userId: req.user._id,
      file: req.file,
    });

    const jobDescription = await JobDescription.create({
      userId: req.user._id,
      rawText: jobDescriptionText,
    });

    const canonicalResumeText = resolveCanonicalResumeText({
      resumeText: resumeSource.extractedText,
      lineMap: resumeSource.lineMap,
    });
    const structuredResume = parseAtsTextToStructured(canonicalResumeText);
    const derivedText = generateAtsText(structuredResume) || canonicalResumeText;

    const analysis = await AtsAnalysis.create({
      userId: req.user._id,
      resumeSourceType: resumeSource.resumeSourceType,
      resumeSourceId: resumeSource.resumeSourceId,
      jobDescriptionId: jobDescription._id,
      status: 'pending',
      progress: 5,
      statusMessage: 'Queued for analysis...',
      resumeText: derivedText,
      originalResumeText: derivedText,
      structuredResume,
      structuredSections: structuredResumeToSections(structuredResume),
      lineMap: resumeSource.lineMap || [],
    });

    setImmediate(() => {
      runAnalysisPipeline(analysis._id, req.user._id).catch((error) => {
        console.error('[resume-scanner] Background job error:', error);
      });
    });

    sendResponse(res, 202, true, 'Resume scanner analysis started.', {
      analysisId: analysis._id,
      status: analysis.status,
      progress: analysis.progress,
    });
  } catch (error) {
    next(error);
  }
};

export const getResumeScannerStatus = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    sendResponse(res, 200, true, 'Analysis status fetched successfully.', {
      analysisId: analysis._id,
      status: analysis.status,
      progress: analysis.progress,
      statusMessage: analysis.statusMessage,
      errorMessage: analysis.errorMessage,
    });
  } catch (error) {
    next(error);
  }
};

export const getResumeScannerAnalysis = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);

    if (!analysis.lineMap?.length && analysis.resumeSourceType === 'scanned') {
      const scannedResume = await ScannedResume.findOne({
        _id: analysis.resumeSourceId,
        userId: req.user._id,
      }).select('lineMap');

      if (scannedResume?.lineMap?.length) {
        analysis.lineMap = scannedResume.lineMap;
      }
    }

    refreshSkillState(analysis, jobDescription);

    if (!hasStructuredResumeData(analysis.structuredResume) && analysis.resumeText) {
      syncDerivedFromStructured(analysis, parseAtsTextToStructured(analysis.resumeText));
      await analysis.save();
    }

    sendResponse(res, 200, true, 'Analysis fetched successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const updateSuggestionStatus = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);
    const suggestion = analysis.suggestions.find((item) => item.id === req.params.suggestionId);

    if (!suggestion) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.SUGGESTION_NOT_FOUND, 404);
    }

    if (suggestion.status !== 'pending') {
      sendResponse(res, 200, true, 'Suggestion already processed.', {
        analysis: serializeAtsAnalysis(analysis, jobDescription),
      });
      return;
    }

    pushHistoryEntry(analysis, `suggestion:${req.body.action}`);

    if (req.body.action === 'accept') {
      const structured = applySuggestionToStructured(ensureStructuredResume(analysis), suggestion);
      syncDerivedFromStructured(analysis, structured);
      suggestion.status = 'accepted';
    } else {
      suggestion.status = 'rejected';
    }

    const recomputed = recomputeAnalysisState({
      resumeText: analysis.resumeText,
      structuredResume: analysis.structuredResume,
      skills: jobDescription.extractedSkills,
      structuredSections: analysis.structuredSections,
      searchabilityIssues: analysis.searchabilityIssues,
      suggestions: analysis.suggestions,
      aiAssessedRelevance: analysis.jobMatchBreakdown?.aiAssessedRelevance || 0,
    });

    applyRecomputedState(analysis, recomputed);
    refreshSkillState(analysis, jobDescription);

    await analysis.save();

    sendResponse(res, 200, true, 'Suggestion updated successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const acceptAllSuggestions = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);
    const pendingSuggestions = analysis.suggestions.filter((item) => item.status === 'pending');

    if (!pendingSuggestions.length) {
      sendResponse(res, 200, true, 'No pending suggestions to accept.', {
        analysis: serializeAtsAnalysis(analysis, jobDescription),
      });
      return;
    }

    pushHistoryEntry(analysis, 'accept-all');

    let structured = ensureStructuredResume(analysis);
    for (const suggestion of pendingSuggestions) {
      structured = applySuggestionToStructured(structured, suggestion);
      suggestion.status = 'accepted';
    }
    syncDerivedFromStructured(analysis, structured);

    const recomputed = recomputeAnalysisState({
      resumeText: analysis.resumeText,
      structuredResume: analysis.structuredResume,
      skills: jobDescription.extractedSkills,
      structuredSections: analysis.structuredSections,
      searchabilityIssues: analysis.searchabilityIssues,
      suggestions: analysis.suggestions,
      aiAssessedRelevance: analysis.jobMatchBreakdown?.aiAssessedRelevance || 0,
    });

    applyRecomputedState(analysis, recomputed);
    refreshSkillState(analysis, jobDescription);

    await analysis.save();

    sendResponse(res, 200, true, 'All suggestions accepted successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const updateResumeScannerText = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (analysis.status !== 'completed') {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.ANALYSIS_NOT_READY, 409);
    }

    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);

    pushHistoryEntry(analysis, 'manual-edit');

    let structured = ensureStructuredResume(analysis);

    if (req.body.structuredResume && typeof req.body.structuredResume === 'object') {
      structured = cloneStructuredResume(req.body.structuredResume);
    } else if (req.body.path != null && Object.prototype.hasOwnProperty.call(req.body, 'value')) {
      structured = setFieldByPath(structured, String(req.body.path), req.body.value);
    } else if (typeof req.body.resumeText === 'string' && req.body.resumeText.trim()) {
      // Legacy flat-text clients: parse into structured once
      structured = parseAtsTextToStructured(sanitizeResumeScannerText(req.body.resumeText));
    } else {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
    }

    syncDerivedFromStructured(analysis, structured);

    const recomputed = recomputeAnalysisState({
      resumeText: analysis.resumeText,
      structuredResume: analysis.structuredResume,
      skills: jobDescription.extractedSkills,
      structuredSections: analysis.structuredSections,
      searchabilityIssues: analysis.searchabilityIssues,
      suggestions: analysis.suggestions,
      aiAssessedRelevance: analysis.jobMatchBreakdown?.aiAssessedRelevance || 0,
    });

    applyRecomputedState(analysis, recomputed);
    refreshSkillState(analysis, jobDescription);

    await analysis.save();

    sendResponse(res, 200, true, 'Resume text updated successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const undoResumeScannerChange = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (!canUndo(analysis)) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.NOTHING_TO_UNDO, 400);
    }

    undoAnalysis(analysis);
    if (!hasStructuredResumeData(analysis.structuredResume) && analysis.resumeText) {
      syncDerivedFromStructured(analysis, parseAtsTextToStructured(analysis.resumeText));
    } else {
      syncDerivedFromStructured(analysis, ensureStructuredResume(analysis));
    }
    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);
    refreshSkillState(analysis, jobDescription);
    await analysis.save();

    sendResponse(res, 200, true, 'Undo applied successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

export const redoResumeScannerChange = async (req, res, next) => {
  try {
    const analysis = await loadAnalysisForUser(req.params.analysisId, req.user._id);

    if (!canRedo(analysis)) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.NOTHING_TO_REDO, 400);
    }

    redoAnalysis(analysis);
    if (!hasStructuredResumeData(analysis.structuredResume) && analysis.resumeText) {
      syncDerivedFromStructured(analysis, parseAtsTextToStructured(analysis.resumeText));
    } else {
      syncDerivedFromStructured(analysis, ensureStructuredResume(analysis));
    }
    const jobDescription = await loadJobDescription(analysis.jobDescriptionId, req.user._id);
    refreshSkillState(analysis, jobDescription);
    await analysis.save();

    sendResponse(res, 200, true, 'Redo applied successfully.', {
      analysis: serializeAtsAnalysis(analysis, jobDescription),
    });
  } catch (error) {
    next(error);
  }
};

```

## 7. BACKEND — Middleware & Validators

### FILE: `backend/src/middleware/resumeScannerUploadMiddleware.js`

```javascript
import multer from 'multer';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from '../utils/sendResponse.js';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new AppError(ERROR_CODES.RESUME_SCANNER.UNSUPPORTED_FILE_TYPE, 400));
  },
});

export const handleResumeScannerUpload = (req, res, next) => {
  return upload.single('resume')(req, res, (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return next(new AppError(ERROR_CODES.RESUME_SCANNER.FILE_TOO_LARGE, 400));
      }
      return next(new AppError(error.message, 400));
    }

    if (error) {
      return next(error);
    }

    return next();
  });
};

```

### FILE: `backend/src/middleware/resumeScannerRateLimiters.js`

```javascript
import rateLimit from 'express-rate-limit';
import { ERROR_CODES, getErrorMessage } from '../constants/apiErrorCodes.js';

export const getResumeScannerRateLimitKey = (req) => {
  if (req.user?._id) {
    return `user:${req.user._id}`;
  }
  return `ip:${req.ip}`;
};

export const resumeScannerHeavyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getResumeScannerRateLimitKey,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    let retryAfterSeconds = Math.max(1, Math.ceil((15 * 60 * 1000) / 1000));

    if (resetTime instanceof Date) {
      retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
    }

    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      code: ERROR_CODES.RATE_LIMIT.RESUME_SCANNER,
      params: {},
      message: getErrorMessage(ERROR_CODES.RATE_LIMIT.RESUME_SCANNER),
      retryAfterSeconds,
    });
  },
});

export const resumeScannerTextLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getResumeScannerRateLimitKey,
  handler: (req, res) => {
    const resetTime = req.rateLimit?.resetTime;
    let retryAfterSeconds = 60;

    if (resetTime instanceof Date) {
      retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
    }

    res.set('Retry-After', String(retryAfterSeconds));
    res.status(429).json({
      success: false,
      code: ERROR_CODES.RATE_LIMIT.RESUME_SCANNER,
      params: {},
      message: getErrorMessage(ERROR_CODES.RATE_LIMIT.RESUME_SCANNER),
      retryAfterSeconds,
    });
  },
});

```

### FILE: `backend/src/validators/resumeScannerValidators.js`

```javascript
import { body, param } from 'express-validator';
import { ERROR_CODES, formatValidationCode } from '../constants/apiErrorCodes.js';

const MAX_JOB_DESCRIPTION_LENGTH = 20000;
const MAX_RESUME_TEXT_LENGTH = 30000;

export const uploadResumeScannerValidation = [
  body('jobDescription')
    .trim()
    .notEmpty()
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED))
    .isLength({ max: MAX_JOB_DESCRIPTION_LENGTH })
    .withMessage(
      formatValidationCode(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_TOO_LONG, {
        max: MAX_JOB_DESCRIPTION_LENGTH,
      })
    ),
  body('mode')
    .optional()
    .isIn(['upload'])
    .withMessage(formatValidationCode(ERROR_CODES.VALIDATION.GENERIC)),
];

export const analysisIdValidation = [
  param('analysisId').isMongoId().withMessage(formatValidationCode(ERROR_CODES.VALIDATION.GENERIC)),
];

export const suggestionActionValidation = [
  ...analysisIdValidation,
  param('suggestionId')
    .trim()
    .notEmpty()
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.SUGGESTION_NOT_FOUND)),
  body('action')
    .isIn(['accept', 'reject'])
    .withMessage(formatValidationCode(ERROR_CODES.RESUME_SCANNER.INVALID_SUGGESTION_ACTION)),
];

export const updateResumeTextValidation = [
  ...analysisIdValidation,
  body().custom((_value, { req }) => {
    const hasStructured =
      req.body?.structuredResume && typeof req.body.structuredResume === 'object';
    const hasPath = typeof req.body?.path === 'string' && req.body.path.trim();
    const hasValue = Object.prototype.hasOwnProperty.call(req.body || {}, 'value');
    const hasText = typeof req.body?.resumeText === 'string' && req.body.resumeText.trim();

    if (hasStructured || (hasPath && hasValue) || hasText) {
      return true;
    }

    throw new Error(formatValidationCode(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY));
  }),
  body('resumeText')
    .optional()
    .isString()
    .isLength({ max: MAX_RESUME_TEXT_LENGTH })
    .withMessage(
      formatValidationCode(ERROR_CODES.VALIDATION.FIELD_MAX_LENGTH, { max: MAX_RESUME_TEXT_LENGTH })
    ),
  body('path').optional().isString().trim(),
  body('structuredResume').optional().isObject(),
];

```

## 8. BACKEND — Models

### FILE: `backend/src/models/AtsAnalysis.js`

```javascript
import mongoose from 'mongoose';

const atsScoreBreakdownSchema = new mongoose.Schema(
  {
    sectionCompleteness: { type: Number, default: 0 },
    searchability: { type: Number, default: 0 },
    quantifiedAchievements: { type: Number, default: 0 },
  },
  { _id: false }
);

const jobMatchBreakdownSchema = new mongoose.Schema(
  {
    keywordCoverage: { type: Number, default: 0 },
    aiAssessedRelevance: { type: Number, default: 0 },
  },
  { _id: false }
);

const workExperienceEntrySchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    company: { type: String, default: '' },
    duration: { type: String, default: '' },
    bullets: { type: [String], default: [] },
  },
  { _id: false }
);

const educationEntrySchema = new mongoose.Schema(
  {
    degree: { type: String, default: '' },
    institution: { type: String, default: '' },
    duration: { type: String, default: '' },
  },
  { _id: false }
);

const structuredResumeSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    contact: {
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      email: { type: String, default: '' },
    },
    summary: { type: String, default: '' },
    workExperience: { type: [workExperienceEntrySchema], default: [] },
    education: { type: [educationEntrySchema], default: [] },
    skills: { type: [String], default: [] },
    languages: { type: [String], default: [] },
  },
  { _id: false }
);

const suggestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['missing_keyword', 'reword', 'remove'],
      required: true,
    },
    original: { type: String, default: '' },
    suggested: { type: String, default: '' },
    reason: { type: String, default: '' },
    impact: { type: Number, default: 1 },
    targetSkillId: { type: String, default: null },
    fieldPath: { type: String, default: '' },
    charStart: { type: Number, default: -1 },
    charEnd: { type: Number, default: -1 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { _id: false }
);

const historyEntrySchema = new mongoose.Schema(
  {
    resumeText: { type: String, default: '' },
    structuredResume: { type: structuredResumeSchema, default: () => ({}) },
    suggestions: { type: [suggestionSchema], default: [] },
    atsScore: { type: Number, default: 0, min: 0, max: 100 },
    jobMatchScore: { type: Number, default: 0, min: 0, max: 100 },
    atsScoreBreakdown: { type: atsScoreBreakdownSchema, default: () => ({}) },
    jobMatchBreakdown: { type: jobMatchBreakdownSchema, default: () => ({}) },
    score: { type: Number, default: 0, min: 0, max: 100 },
    matchedSkillIds: { type: [String], default: [] },
    missingSkillIds: { type: [String], default: [] },
    action: { type: String, default: '' },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const atsAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    resumeSourceType: {
      type: String,
      enum: ['built', 'scanned'],
      required: true,
    },
    resumeSourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    jobDescriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobDescription',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'extracting', 'analyzing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    statusMessage: {
      type: String,
      default: '',
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    score: { type: Number, default: 0, min: 0, max: 100 },
    atsScore: { type: Number, default: 0, min: 0, max: 100 },
    jobMatchScore: { type: Number, default: 0, min: 0, max: 100 },
    atsScoreBreakdown: { type: atsScoreBreakdownSchema, default: () => ({}) },
    jobMatchBreakdown: { type: jobMatchBreakdownSchema, default: () => ({}) },
    matchedSkillIds: {
      type: [String],
      default: [],
    },
    missingSkillIds: {
      type: [String],
      default: [],
    },
    resumeText: {
      type: String,
      default: '',
    },
    originalResumeText: {
      type: String,
      default: '',
    },
    structuredResume: {
      type: structuredResumeSchema,
      default: () => ({}),
    },
    structuredSections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lineMap: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    suggestions: {
      type: [suggestionSchema],
      default: [],
    },
    searchabilityIssues: {
      type: [String],
      default: [],
    },
    recruiterTips: {
      type: [String],
      default: [],
    },
    coverLetter: {
      type: String,
      default: '',
    },
    history: {
      type: [historyEntrySchema],
      default: [],
    },
    historyIndex: {
      type: Number,
      default: -1,
    },
    errorMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

atsAnalysisSchema.index({ userId: 1, createdAt: -1 });

const AtsAnalysis = mongoose.model('AtsAnalysis', atsAnalysisSchema);

export default AtsAnalysis;

```

### FILE: `backend/src/models/ScannedResume.js`

```javascript
import mongoose from 'mongoose';

const sourceFileSchema = new mongoose.Schema(
  {
    filename: { type: String, trim: true, default: '' },
    mimeType: { type: String, trim: true, default: '' },
    size: { type: Number, default: 0 },
    extension: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const scannedResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    label: {
      type: String,
      trim: true,
      default: 'Uploaded Resume',
    },
    sourceFile: {
      type: sourceFileSchema,
      default: () => ({}),
    },
    extractedText: {
      type: String,
      default: '',
    },
    structuredSections: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lineMap: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    extractionMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

scannedResumeSchema.index({ userId: 1, updatedAt: -1 });

const ScannedResume = mongoose.model('ScannedResume', scannedResumeSchema);

export default ScannedResume;

```

### FILE: `backend/src/models/JobDescription.js`

```javascript
import mongoose from 'mongoose';

const extractedSkillSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['required', 'hard', 'soft'],
      default: 'hard',
    },
    synonyms: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const jobDescriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    rawText: {
      type: String,
      required: true,
      maxlength: 20000,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    company: {
      type: String,
      trim: true,
      default: '',
    },
    extractedSkills: {
      type: [extractedSkillSchema],
      default: [],
    },
  },
  { timestamps: true }
);

jobDescriptionSchema.index({ userId: 1, createdAt: -1 });

const JobDescription = mongoose.model('JobDescription', jobDescriptionSchema);

export default JobDescription;

```

## 9. BACKEND — Utils

### FILE: `backend/src/utils/structuredResume.js`

```javascript
const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}(?:\s*(?:ext\.?|x)\s*\d+)?/i;
const BULLET_RE = /^(?:[-•*‣▪◦]|\d+[.)]|[a-zA-Z][.)])\s+/;
const DATE_RANGE_RE =
  /\b(?:(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+)?(?:19|20)\d{2}\b.*\b(?:present|current|now|(?:19|20)\d{2})\b/i;

const SECTION_SPECS = [
  {
    type: 'summary',
    keys: [
      'professional summary',
      'career summary',
      'executive summary',
      'about me',
      'summary',
      'profile',
      'objective',
    ],
  },
  {
    type: 'experience',
    keys: [
      'professional experience',
      'work experience',
      'employment history',
      'career history',
      'work history',
      'employment',
      'experience',
    ],
  },
  {
    type: 'education',
    keys: ['academic background', 'academic qualifications', 'education', 'qualifications'],
  },
  {
    type: 'skills',
    keys: [
      'areas of expertise',
      'core competencies',
      'technical skills',
      'key skills',
      'skills',
      'expertise',
      'competencies',
    ],
  },
  { type: 'languages', keys: ['language proficiency', 'languages', 'language'] },
];

const EXACT_ONLY = new Set([
  'summary',
  'profile',
  'objective',
  'experience',
  'employment',
  'education',
  'skills',
  'expertise',
  'competencies',
  'languages',
  'language',
  'qualifications',
]);

const normalizeHeading = (line = '') =>
  String(line)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim();

export const emptyStructuredResume = () => ({
  name: '',
  contact: { address: '', phone: '', email: '' },
  summary: '',
  workExperience: [],
  education: [],
  skills: [],
  languages: [],
});

export const cloneStructuredResume = (value) => {
  const base = emptyStructuredResume();
  const src = value && typeof value === 'object' ? value : {};
  return {
    name: String(src.name || ''),
    contact: {
      address: String(src.contact?.address || ''),
      phone: String(src.contact?.phone || ''),
      email: String(src.contact?.email || ''),
    },
    summary: String(src.summary || ''),
    workExperience: Array.isArray(src.workExperience)
      ? src.workExperience.map((job) => ({
          title: String(job?.title || ''),
          company: String(job?.company || ''),
          duration: String(job?.duration || ''),
          bullets: Array.isArray(job?.bullets)
            ? job.bullets.map((b) => String(b || '')).filter(Boolean)
            : [],
        }))
      : [],
    education: Array.isArray(src.education)
      ? src.education.map((ed) => ({
          degree: String(ed?.degree || ''),
          institution: String(ed?.institution || ''),
          duration: String(ed?.duration || ''),
        }))
      : [],
    skills: Array.isArray(src.skills) ? src.skills.map((s) => String(s || '')).filter(Boolean) : [],
    languages: Array.isArray(src.languages)
      ? src.languages.map((s) => String(s || '')).filter(Boolean)
      : [],
  };
};

export const detectSectionType = (line = '') => {
  const normalized = normalizeHeading(line);
  if (!normalized) return null;

  for (const spec of SECTION_SPECS) {
    const keys = [...spec.keys].sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (EXACT_ONLY.has(key)) {
        if (normalized === key) return spec.type;
      } else if (normalized === key || normalized.startsWith(`${key} `)) {
        return spec.type;
      }
    }
  }
  return null;
};

const stripBullet = (line = '') => line.replace(BULLET_RE, '').trim();

const isBulletLine = (line = '') => BULLET_RE.test(line.trim());

const splitListItems = (text = '') =>
  String(text || '')
    .split(/[,|\n•]+/)
    .map((part) => part.trim())
    .filter(Boolean);

const looksLikeDuration = (line = '') => DATE_RANGE_RE.test(line) || /\b(?:19|20)\d{2}\b/.test(line);

const parseExperienceBlock = (lines = []) => {
  const jobs = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    if (current.title || current.company || current.duration || current.bullets.length) {
      jobs.push(current);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      pushCurrent();
      continue;
    }

    if (isBulletLine(line)) {
      if (!current) {
        current = { title: '', company: '', duration: '', bullets: [] };
      }
      current.bullets.push(stripBullet(line));
      continue;
    }

    if (looksLikeDuration(line) && current && !current.duration) {
      current.duration = line;
      continue;
    }

    // New job header — "Title, Company" or "Title — Company" or single title line
    pushCurrent();
    current = { title: '', company: '', duration: '', bullets: [] };

    if (looksLikeDuration(line)) {
      current.duration = line;
      continue;
    }

    const parts = line.split(/\s+[—–\-|,]\s+/);
    if (parts.length >= 2) {
      current.title = parts[0].trim();
      current.company = parts.slice(1).join(' — ').trim();
    } else {
      current.title = line;
    }
  }

  pushCurrent();
  return jobs;
};

const parseEducationBlock = (lines = []) => {
  const entries = [];
  let current = null;

  const pushCurrent = () => {
    if (!current) return;
    if (current.degree || current.institution || current.duration) {
      entries.push(current);
    }
    current = null;
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      pushCurrent();
      continue;
    }

    if (looksLikeDuration(line) && current && !current.duration) {
      current.duration = line;
      continue;
    }

    pushCurrent();
    current = { degree: '', institution: '', duration: '' };

    if (looksLikeDuration(line)) {
      current.duration = line;
      continue;
    }

    const parts = line.split(/\s+[—–\-|,]\s+/);
    if (parts.length >= 2) {
      current.degree = parts[0].trim();
      current.institution = parts.slice(1).join(' — ').trim();
    } else {
      current.degree = line;
    }
  }

  pushCurrent();
  return entries;
};

/**
 * Best-effort parse of flat ATS text into structuredResume.
 */
export const parseAtsTextToStructured = (fullText = '') => {
  const text = String(fullText || '').replace(/\r\n/g, '\n').trim();
  const result = emptyStructuredResume();
  if (!text) return result;

  const rawLines = text.split('\n');
  const sections = [];
  let current = null;
  const headerLines = [];

  for (const line of rawLines) {
    const sectionType = detectSectionType(line);
    if (sectionType) {
      if (current) sections.push(current);
      current = { type: sectionType, lines: [] };
      continue;
    }
    if (current) {
      current.lines.push(line);
    } else if (line.trim()) {
      headerLines.push(line.trim());
    }
  }
  if (current) sections.push(current);

  // Contact / name from pre-section header
  const contactLines = [];
  const nameCandidates = [];
  for (const line of headerLines) {
    if (EMAIL_RE.test(line)) {
      const match = line.match(EMAIL_RE);
      if (match) result.contact.email = match[0];
      contactLines.push(line);
    } else if (PHONE_RE.test(line) && (line.match(/\d/g) || []).length >= 7) {
      const match = line.match(PHONE_RE);
      if (match) result.contact.phone = match[0].trim();
      contactLines.push(line);
    } else if (/linkedin|github|http|www\./i.test(line)) {
      contactLines.push(line);
    } else if (!result.contact.address && /,/.test(line) && line.length < 80) {
      result.contact.address = line;
    } else {
      nameCandidates.push(line);
    }
  }
  result.name = nameCandidates[0] || '';

  for (const section of sections) {
    const bodyLines = section.lines.map((l) => l.trimEnd());
    const bodyText = bodyLines.join('\n').trim();

    if (section.type === 'summary') {
      result.summary = bodyText;
    } else if (section.type === 'experience') {
      result.workExperience = parseExperienceBlock(bodyLines);
    } else if (section.type === 'education') {
      result.education = parseEducationBlock(bodyLines);
    } else if (section.type === 'skills') {
      result.skills = splitListItems(bodyText);
    } else if (section.type === 'languages') {
      result.languages = splitListItems(bodyText);
    }
  }

  // Fallback: if nothing parsed into sections, stash first chunk as summary
  if (
    !result.summary &&
    !result.workExperience.length &&
    !result.education.length &&
    !result.skills.length &&
    text
  ) {
    result.summary = text;
  }

  return result;
};

/**
 * ONLY place that produces flat ATS plain text from structured resume.
 */
export const generateAtsText = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  const lines = [];

  if (data.name) lines.push(data.name);

  const contactBits = [data.contact.email, data.contact.phone, data.contact.address].filter(Boolean);
  if (contactBits.length) lines.push(contactBits.join(' | '));

  if (data.name || contactBits.length) lines.push('');

  if (data.summary.trim()) {
    lines.push('PROFESSIONAL SUMMARY');
    lines.push(data.summary.trim());
    lines.push('');
  }

  if (data.workExperience.length) {
    lines.push('WORK EXPERIENCE');
    for (const job of data.workExperience) {
      const header = [job.title, job.company].filter(Boolean).join(', ');
      if (header) lines.push(header);
      if (job.duration) lines.push(job.duration);
      for (const bullet of job.bullets) {
        const cleaned = String(bullet || '').trim();
        if (cleaned) lines.push(cleaned.startsWith('-') || cleaned.startsWith('•') ? cleaned : `• ${cleaned}`);
      }
      lines.push('');
    }
  }

  if (data.education.length) {
    lines.push('EDUCATION');
    for (const ed of data.education) {
      const header = [ed.degree, ed.institution].filter(Boolean).join(', ');
      if (header) lines.push(header);
      if (ed.duration) lines.push(ed.duration);
      lines.push('');
    }
  }

  if (data.skills.length) {
    lines.push('SKILLS');
    lines.push(data.skills.join(', '));
    lines.push('');
  }

  if (data.languages.length) {
    lines.push('LANGUAGES');
    lines.push(data.languages.join(', '));
    lines.push('');
  }

  while (lines.length && !String(lines[lines.length - 1]).trim()) {
    lines.pop();
  }

  return lines.join('\n');
};

export const getFieldByPath = (obj, path = '') => {
  if (!path) return undefined;
  const parts = String(path).split('.');
  let current = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    const key = /^\d+$/.test(part) ? Number(part) : part;
    current = current[key];
  }
  return current;
};

export const setFieldByPath = (obj, path = '', value) => {
  const clone = cloneStructuredResume(obj);
  const parts = String(path).split('.');
  if (!parts.length || !parts[0]) return clone;

  let current = clone;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const part = parts[i];
    const key = /^\d+$/.test(part) ? Number(part) : part;
    const nextPart = parts[i + 1];
    const nextIsIndex = /^\d+$/.test(nextPart);

    if (current[key] == null) {
      current[key] = nextIsIndex ? [] : {};
    }
    current = current[key];
  }

  const last = parts[parts.length - 1];
  const lastKey = /^\d+$/.test(last) ? Number(last) : last;
  current[lastKey] = value;
  return clone;
};

export const updateField = setFieldByPath;

export const findPathForOriginal = (structured, original = '') => {
  const needle = String(original || '').trim();
  if (!needle) return '';

  const data = cloneStructuredResume(structured);
  if (data.summary.includes(needle)) return 'summary';

  for (let i = 0; i < data.workExperience.length; i += 1) {
    const job = data.workExperience[i];
    if (job.title.includes(needle)) return `workExperience.${i}.title`;
    if (job.company.includes(needle)) return `workExperience.${i}.company`;
    if (job.duration.includes(needle)) return `workExperience.${i}.duration`;
    for (let j = 0; j < job.bullets.length; j += 1) {
      if (job.bullets[j].includes(needle)) return `workExperience.${i}.bullets.${j}`;
    }
  }

  for (let i = 0; i < data.education.length; i += 1) {
    const ed = data.education[i];
    if (ed.degree.includes(needle)) return `education.${i}.degree`;
    if (ed.institution.includes(needle)) return `education.${i}.institution`;
    if (ed.duration.includes(needle)) return `education.${i}.duration`;
  }

  for (let i = 0; i < data.skills.length; i += 1) {
    if (data.skills[i].includes(needle)) return `skills.${i}`;
  }

  for (let i = 0; i < data.languages.length; i += 1) {
    if (data.languages[i].includes(needle)) return `languages.${i}`;
  }

  return '';
};

export const applySuggestionToStructured = (structured, suggestion = {}) => {
  let data = cloneStructuredResume(structured);
  let path = String(suggestion.fieldPath || '').trim();

  if (!path) {
    path = findPathForOriginal(data, suggestion.original);
  }

  if (!path) {
    // missing_keyword with no path — append suggested to summary
    if (suggestion.type === 'missing_keyword' && suggestion.suggested) {
      data.summary = `${data.summary}\n${suggestion.suggested}`.trim();
    }
    return data;
  }

  const current = getFieldByPath(data, path);
  const currentText = current == null ? '' : String(current);

  if (suggestion.type === 'remove') {
    if (suggestion.original && currentText.includes(suggestion.original)) {
      return setFieldByPath(data, path, currentText.replace(suggestion.original, '').replace(/\s{2,}/g, ' ').trim());
    }
    return setFieldByPath(data, path, '');
  }

  if (suggestion.type === 'missing_keyword') {
    const addition = suggestion.suggested || '';
    if (!addition) return data;
    if (currentText.includes(addition)) return data;
    const next = currentText ? `${currentText}${currentText.endsWith('.') ? '' : ''} ${addition}`.trim() : addition;
    return setFieldByPath(data, path, next);
  }

  // reword
  if (suggestion.original && currentText.includes(suggestion.original)) {
    return setFieldByPath(
      data,
      path,
      currentText.replace(suggestion.original, suggestion.suggested || '')
    );
  }

  if (suggestion.suggested) {
    return setFieldByPath(data, path, suggestion.suggested);
  }

  return data;
};

/**
 * Map structuredResume → StructuredResumeView / scoring structuredSections shape.
 */
export const structuredResumeToSections = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  const contactLines = [data.contact.email, data.contact.phone, data.contact.address].filter(Boolean);

  const experienceParagraphs = data.workExperience.map((job) => {
    const parts = [];
    const header = [job.title, job.company].filter(Boolean).join(', ');
    if (header) parts.push(header);
    if (job.duration) parts.push(job.duration);
    for (const bullet of job.bullets) {
      const cleaned = String(bullet || '').trim();
      if (cleaned) parts.push(cleaned.startsWith('•') || cleaned.startsWith('-') ? cleaned : `• ${cleaned}`);
    }
    return parts.join('\n');
  });

  const educationParagraphs = data.education.map((ed) => {
    const parts = [];
    const header = [ed.degree, ed.institution].filter(Boolean).join(', ');
    if (header) parts.push(header);
    if (ed.duration) parts.push(ed.duration);
    return parts.join('\n');
  });

  return {
    contact: {
      name: data.name,
      headline: '',
      lines: contactLines,
      text: contactLines.join('\n'),
    },
    summary: {
      text: data.summary,
      paragraphs: data.summary ? [data.summary] : [],
    },
    experience: {
      text: experienceParagraphs.join('\n\n'),
      paragraphs: experienceParagraphs,
    },
    education: {
      text: educationParagraphs.join('\n\n'),
      paragraphs: educationParagraphs,
    },
    skills: {
      text: data.skills.join(', '),
      items: data.skills,
      paragraphs: data.skills.length ? [data.skills.join(', ')] : [],
    },
    additional_sections: data.languages.length
      ? [
          {
            type: 'languages',
            heading: 'LANGUAGES',
            text: data.languages.join(', '),
            paragraphs: [data.languages.join(', ')],
          },
        ]
      : [],
    unassigned: { text: '' },
  };
};

export const hasStructuredResumeData = (structuredResume = {}) => {
  const data = cloneStructuredResume(structuredResume);
  return Boolean(
    data.name ||
      data.contact.email ||
      data.contact.phone ||
      data.summary ||
      data.workExperience.length ||
      data.education.length ||
      data.skills.length ||
      data.languages.length
  );
};

```

### FILE: `backend/src/utils/resumeScannerExtractionService.js`

```javascript
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { extractResumeWithPythonService } from './pythonExtractorService.js';
import { extractResumeTextFromFile } from './resumeFileExtractor.js';
import { cleanExtractedText } from './resumeTextCleanup.js';
import { AppError } from './sendResponse.js';

export const extractResumeForScanner = async (file) => {
  if (!file?.buffer) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.FILE_REQUIRED, 400);
  }

  const filename = file.originalname || 'resume.pdf';

  try {
    const pythonResult = await extractResumeWithPythonService(file.buffer, filename);
    const fullText = cleanExtractedText(pythonResult.full_text || '');

    if (!fullText) {
      throw new AppError(ERROR_CODES.RESUME_SCANNER.EXTRACTION_FAILED, 400);
    }

    return {
      extractedText: fullText,
      structuredSections: pythonResult.structured_sections || {},
      lineMap: pythonResult.lines || [],
      extractionMetadata: {
        ...(pythonResult.metadata || {}),
        source: pythonResult.source || 'python',
        pages: pythonResult.pages || 0,
        fileType: pythonResult.file_type || '',
        rawText: pythonResult.raw_text || '',
        atsNormalized: Boolean(pythonResult.metadata?.ats_normalized),
        normalizationMethod: pythonResult.metadata?.normalization_method || '',
        normalizationChanged: Boolean(pythonResult.metadata?.normalization_changed),
      },
      sourceFile: {
        filename,
        mimeType: file.mimetype || '',
        size: file.size || file.buffer.length,
        extension: filename.includes('.') ? filename.split('.').pop().toLowerCase() : '',
      },
    };
  } catch (error) {
    console.warn('[resume-scanner] Python extract-resume failed, using Node fallback:', error.message);
  }

  const fallbackText = await extractResumeTextFromFile(file);

  return {
    extractedText: fallbackText,
    structuredSections: {},
    lineMap: [],
    extractionMetadata: {
      source: 'node-fallback',
      pages: 1,
      fileType: filename.split('.').pop()?.toLowerCase() || '',
    },
    sourceFile: {
      filename,
      mimeType: file.mimetype || '',
      size: file.size || file.buffer.length,
      extension: filename.includes('.') ? filename.split('.').pop().toLowerCase() : '',
    },
  };
};

```

### FILE: `backend/src/utils/resumeScannerAiService.js`

```javascript
import { isAnthropicConfigured } from '../config/anthropicConfig.js';
import { isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { analyzeResumeWithClaude } from './resumeScannerClaudeService.js';
import { analyzeResumeWithGroq } from './resumeScannerGroqService.js';
import {
  anchorSuggestionsToResume,
  computeAnalysisScores,
  computeSkillMatches,
} from './resumeScannerScoring.js';
import { sanitizeResumeScannerText } from './resumeScannerTextUtils.js';
import {
  cloneStructuredResume,
  generateAtsText,
  hasStructuredResumeData,
  parseAtsTextToStructured,
  structuredResumeToSections,
} from './structuredResume.js';
import { AppError } from './sendResponse.js';

export const getResumeScannerAiProvider = () => {
  if (isGroqConfigured()) return 'groq';
  if (isAnthropicConfigured()) return 'claude';
  return 'none';
};

export const analyzeResumeAgainstJob = async ({
  resumeText,
  jobDescriptionText,
  jobTitle = '',
  structuredSections = {},
  structuredResume = null,
}) => {
  const cleanResume = sanitizeResumeScannerText(resumeText);
  const cleanJobDescription = sanitizeResumeScannerText(jobDescriptionText);

  if (!cleanResume) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.RESUME_TEXT_EMPTY, 400);
  }

  if (!cleanJobDescription) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.JOB_DESCRIPTION_REQUIRED, 400);
  }

  const structured =
    structuredResume && hasStructuredResumeData(structuredResume)
      ? cloneStructuredResume(structuredResume)
      : parseAtsTextToStructured(cleanResume);

  let aiResult;
  let provider = 'none';

  if (isGroqConfigured()) {
    try {
      aiResult = await analyzeResumeWithGroq({
        resumeText: cleanResume.slice(0, 14000),
        jobDescriptionText: cleanJobDescription.slice(0, 12000),
        jobTitle: jobTitle.trim(),
      });
      provider = 'groq';
    } catch (error) {
      console.warn('[resume-scanner] Groq analysis failed:', error.message);
      if (!isAnthropicConfigured()) {
        throw error;
      }
    }
  }

  if (!aiResult && isAnthropicConfigured()) {
    aiResult = await analyzeResumeWithClaude({
      resumeText: cleanResume.slice(0, 14000),
      jobDescriptionText: cleanJobDescription.slice(0, 12000),
      jobTitle: jobTitle.trim(),
    });
    provider = 'claude';
  }

  if (!aiResult) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  const sections = structuredSections && Object.keys(structuredSections).length
    ? structuredSections
    : structuredResumeToSections(structured);

  const skillMatch = computeSkillMatches(cleanResume, aiResult.skills);
  const scores = computeAnalysisScores({
    resumeText: cleanResume,
    structuredSections: sections,
    searchabilityIssues: aiResult.searchabilityIssues,
    skills: skillMatch.skills,
    aiAssessedRelevance: aiResult.score,
  });
  const anchoredSuggestions = anchorSuggestionsToResume(
    cleanResume,
    aiResult.suggestions,
    structured
  );

  return {
    provider,
    jobTitle: aiResult.jobTitle,
    company: aiResult.company,
    skills: scores.skills,
    matchedSkillIds: scores.matchedSkillIds,
    missingSkillIds: scores.missingSkillIds,
    atsScore: scores.atsScore,
    atsScoreBreakdown: scores.atsScoreBreakdown,
    jobMatchScore: scores.jobMatchScore,
    jobMatchBreakdown: scores.jobMatchBreakdown,
    score: scores.jobMatchScore,
    suggestions: anchoredSuggestions,
    searchabilityIssues: aiResult.searchabilityIssues,
    recruiterTips: aiResult.recruiterTips,
    structuredResume: structured,
  };
};

export const recomputeAnalysisState = ({
  resumeText,
  skills,
  structuredSections = {},
  structuredResume = null,
  searchabilityIssues = [],
  suggestions = [],
  aiAssessedRelevance = 0,
}) => {
  const structured =
    structuredResume && hasStructuredResumeData(structuredResume)
      ? cloneStructuredResume(structuredResume)
      : parseAtsTextToStructured(resumeText);

  const cleanResume = sanitizeResumeScannerText(
    resumeText || generateAtsText(structured)
  );
  const derivedText = generateAtsText(structured);
  const nextSections = structuredResumeToSections(structured);

  const pendingSuggestions = suggestions.filter((item) => item.status === 'pending');
  const finalizedSuggestions = suggestions.filter((item) => item.status !== 'pending');
  const anchoredPending = anchorSuggestionsToResume(derivedText, pendingSuggestions, structured);
  const suggestionsWithStatus = [...finalizedSuggestions, ...anchoredPending];

  const scores = computeAnalysisScores({
    resumeText: derivedText || cleanResume,
    structuredSections: nextSections,
    searchabilityIssues,
    skills,
    aiAssessedRelevance,
  });

  return {
    resumeText: derivedText || cleanResume,
    structuredResume: structured,
    structuredSections: nextSections,
    skills: scores.skills,
    matchedSkillIds: scores.matchedSkillIds,
    missingSkillIds: scores.missingSkillIds,
    atsScore: scores.atsScore,
    atsScoreBreakdown: scores.atsScoreBreakdown,
    jobMatchScore: scores.jobMatchScore,
    jobMatchBreakdown: scores.jobMatchBreakdown,
    score: scores.jobMatchScore,
    suggestions: suggestionsWithStatus,
  };
};

```

### FILE: `backend/src/utils/resumeScannerGroqService.js`

```javascript
import Groq from 'groq-sdk';
import { getGroqConfig, isGroqConfigured } from '../config/groqConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { extractJsonFromText } from './resumeAiPrompts.js';
import { buildResumeScannerPrompt, RESUME_SCANNER_SYSTEM_PROMPT } from './resumeScannerPrompts.js';
import { parseResumeScannerAnalysis } from './resumeScannerSchemas.js';
import { AppError } from './sendResponse.js';

const MAX_RETRIES = 2;

const getClient = () => {
  const { apiKey } = getGroqConfig();
  if (!apiKey) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }
  return new Groq({ apiKey });
};

const parseModelJson = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    return extractJsonFromText(content);
  }
};

export const analyzeResumeWithGroq = async ({ resumeText, jobDescriptionText, jobTitle = '' }, attempt = 0) => {
  if (!isGroqConfigured()) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  const { model } = getGroqConfig();
  const client = getClient();

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: RESUME_SCANNER_SYSTEM_PROMPT },
      {
        role: 'user',
        content: buildResumeScannerPrompt({ resumeText, jobDescriptionText, jobTitle }),
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_EMPTY_RESPONSE, 502);
  }

  try {
    const parsed = parseModelJson(content);
    return parseResumeScannerAnalysis(parsed);
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(`[resume-scanner] Groq JSON validation failed (attempt ${attempt + 1}):`, error.message);
      return analyzeResumeWithGroq({ resumeText, jobDescriptionText, jobTitle }, attempt + 1);
    }
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_INVALID_RESPONSE, 502);
  }
};

```

### FILE: `backend/src/utils/resumeScannerClaudeService.js`

```javascript
import Anthropic from '@anthropic-ai/sdk';
import { getAnthropicConfig, isAnthropicConfigured } from '../config/anthropicConfig.js';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { extractJsonFromText } from './resumeAiPrompts.js';
import { buildResumeScannerPrompt, RESUME_SCANNER_SYSTEM_PROMPT } from './resumeScannerPrompts.js';
import { parseResumeScannerAnalysis } from './resumeScannerSchemas.js';
import { AppError } from './sendResponse.js';

const MAX_RETRIES = 2;

const getClient = () => {
  const { apiKey } = getAnthropicConfig();
  if (!apiKey) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }
  return new Anthropic({ apiKey });
};

export const analyzeResumeWithClaude = async ({ resumeText, jobDescriptionText, jobTitle = '' }, attempt = 0) => {
  if (!isAnthropicConfigured()) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_NOT_CONFIGURED, 503);
  }

  const { model } = getAnthropicConfig();
  const client = getClient();

  const response = await client.messages.create({
    model,
    max_tokens: 4096,
    temperature: 0.2,
    system: RESUME_SCANNER_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildResumeScannerPrompt({ resumeText, jobDescriptionText, jobTitle }),
      },
    ],
  });

  const content = response.content
    ?.map((block) => (block.type === 'text' ? block.text : ''))
    .join('')
    .trim();

  if (!content) {
    throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_EMPTY_RESPONSE, 502);
  }

  try {
    const parsed = JSON.parse(content);
    return parseResumeScannerAnalysis(parsed);
  } catch {
    try {
      const parsed = extractJsonFromText(content);
      return parseResumeScannerAnalysis(parsed);
    } catch (error) {
      if (attempt < MAX_RETRIES) {
        console.warn(`[resume-scanner] Claude JSON validation failed (attempt ${attempt + 1}):`, error.message);
        return analyzeResumeWithClaude({ resumeText, jobDescriptionText, jobTitle }, attempt + 1);
      }
      throw new AppError(ERROR_CODES.RESUME_SCANNER.AI_INVALID_RESPONSE, 502);
    }
  }
};

```

### FILE: `backend/src/utils/resumeScannerPrompts.js`

```javascript
export const RESUME_SCANNER_SYSTEM_PROMPT = `You are an expert ATS Resume Analyzer, Recruiter, and Career Intelligence AI.

Compare a candidate resume against a job description and return structured JSON only.
You are NOT a keyword counter. Understand synonyms, context, experience evidence, seniority, impact of achievements, and skill relevance.

Core rules:
1. Never mark a skill as unmatched if the resume contains a synonym, acronym, or equivalent phrasing.
   Examples: "Search Engine Optimization" matches "SEO"; "Amazon Web Services" matches "AWS"; "GA4" matches "Google Analytics 4".
2. Only report skills as missing when they are genuinely absent from the resume (after synonym and context checks).
3. Never invent candidate experience, companies, projects, or achievements.
4. Every suggestion must reference a real issue in the resume text. Do not suggest changes for content that does not exist.
5. Evaluate achievements by numbers, measurable impact, and business outcomes. Flag weak vague bullets (e.g. "worked on APIs") and prefer stronger rewrites only when anchored to real resume text.
6. Assess experience level and seniority fit against the job title and description.
7. Extract concrete skills from the job description and classify each as required, hard, or soft.
8. Score using this rubric (weights must sum to 100 across components):
   - keywordCoverage (40%): % of required + hard skills evidenced in the resume (semantic matching allowed)
   - sectionCompleteness (20%): presence/quality of summary, experience, education, skills sections
   - searchability (20%): ATS-friendly formatting signals (standard headings, contact info, no fluff)
   - quantifiedAchievements (20%): metrics, numbers, measurable outcomes in experience bullets
9. For each scoreBreakdown component include score (0-100), weight, weighted (score * weight / 100), and short notes.
   Use notes to capture experience-match reasoning and ATS structure/readability observations.
10. suggestions must reference exact substrings that appear in the resume text for reword/remove types.
11. missing_keyword suggestions should use a short original anchor phrase from the resume where the keyword should be added, and suggested should include the keyword naturally.
12. impact is 1-5 indicating estimated ATS/job-match lift if accepted.
13. Return at most 20 suggestions, ordered by impact descending.
14. skill ids must be stable strings like skill-react-1.
15. Every suggestion MUST include fieldPath pointing at the structured field to edit, using dot paths such as:
    "summary", "workExperience.0.bullets.1", "education.0.degree", "skills.2", "languages.0".
16. Map deeper analysis into existing fields:
    - resume strengths → recruiterTips entries prefixed with "Strength: "
    - resume weaknesses → recruiterTips entries prefixed with "Weakness: "
    - experience-match insight → scoreBreakdown.keywordCoverage.notes and/or recruiterTips
    - final hiring recommendation → last recruiterTips entry prefixed with "Recommendation: "
    - ATS structure/readability issues → searchabilityIssues
17. Return JSON only. No markdown. No text outside JSON.`;

export const buildResumeScannerPrompt = ({
  resumeText,
  jobDescriptionText,
  jobTitle = '',
}) => {
  const titleBlock = jobTitle.trim()
    ? `Job title:\n"""\n${jobTitle.trim()}\n"""\n\n`
    : '';

  return `${titleBlock}Job description:
"""
${jobDescriptionText}
"""

Resume:
"""
${resumeText}
"""

Analyze the resume against the job title (if provided) and job description.
Return JSON only in exactly this shape:
{
  "jobTitle": "string — inferred or confirmed role title from the job description",
  "company": "string — inferred company name if present in JD, else empty",
  "skills": [
    {
      "id": "skill-example-1",
      "name": "Skill name from JD",
      "type": "required|hard|soft",
      "synonyms": ["resume-side alias if matched via synonym"],
      "matched": true,
      "matchEvidence": "short exact quote or phrase from resume if matched, else empty"
    }
  ],
  "score": 0,
  "scoreBreakdown": {
    "keywordCoverage": { "score": 0, "weight": 40, "weighted": 0, "notes": "skill + experience relevance" },
    "sectionCompleteness": { "score": 0, "weight": 20, "weighted": 0, "notes": "" },
    "searchability": { "score": 0, "weight": 20, "weighted": 0, "notes": "structure + readability" },
    "quantifiedAchievements": { "score": 0, "weight": 20, "weighted": 0, "notes": "impact evidence" }
  },
  "suggestions": [
    {
      "id": "suggestion-1",
      "type": "missing_keyword|reword|remove",
      "original": "exact resume substring",
      "suggested": "replacement text or empty for remove",
      "reason": "specific problem and why this improves ATS/job match",
      "impact": 1,
      "targetSkillId": "skill-example-1",
      "fieldPath": "summary | workExperience.0.bullets.1 | education.0.degree | skills.0"
    }
  ],
  "searchabilityIssues": ["ATS formatting or readability issue"],
  "recruiterTips": ["Strength: ...", "Weakness: ...", "Recommendation: ..."]
}`;
};

```

### FILE: `backend/src/utils/resumeScannerSchemas.js`

```javascript
import { z } from 'zod';

const skillSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['required', 'hard', 'soft']),
  synonyms: z.array(z.string()).default([]),
  matched: z.boolean().optional(),
  matchEvidence: z.string().optional(),
});

const scoreComponentSchema = z.object({
  score: z.number().min(0).max(100),
  weight: z.number().min(0).max(100),
  weighted: z.number().min(0).max(100),
  notes: z.string().optional(),
});

const suggestionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['missing_keyword', 'reword', 'remove']),
  original: z.string(),
  suggested: z.string(),
  reason: z.string().min(1),
  impact: z.number().min(0).max(10),
  targetSkillId: z.string().nullable().optional(),
  fieldPath: z.string().optional().default(''),
});

export const resumeScannerAnalysisSchema = z.object({
  jobTitle: z.string().default(''),
  company: z.string().default(''),
  skills: z.array(skillSchema).min(1),
  score: z.number().min(0).max(100),
  scoreBreakdown: z.object({
    keywordCoverage: scoreComponentSchema,
    sectionCompleteness: scoreComponentSchema,
    searchability: scoreComponentSchema,
    quantifiedAchievements: scoreComponentSchema,
  }),
  suggestions: z.array(suggestionSchema).default([]),
  searchabilityIssues: z.array(z.string()).default([]),
  recruiterTips: z.array(z.string()).default([]),
});

export const parseResumeScannerAnalysis = (payload) => resumeScannerAnalysisSchema.parse(payload);

```

### FILE: `backend/src/utils/resumeScannerScoring.js`

```javascript
import {
  clampScore,
  createSkillId,
  createSuggestionId,
  escapeRegExp,
  normalizeSkillToken,
  resolveStoredSkillId,
} from './resumeScannerTextUtils.js';
import { findPathForOriginal, getFieldByPath } from './structuredResume.js';

const ACRONYM_ALIASES = {
  ga4: ['google analytics 4', 'google analytics'],
  seo: ['search engine optimization'],
  b2b: ['business to business'],
  b2c: ['business to consumer'],
  api: ['application programming interface'],
  sql: ['structured query language'],
};

const ATS_WEIGHTS = {
  sectionCompleteness: 0.35,
  searchability: 0.35,
  quantifiedAchievements: 0.3,
};

const JOB_MATCH_KEYWORD_WEIGHT = 0.85;
const JOB_MATCH_AI_WEIGHT_DEFAULT = 0.15;
const JOB_MATCH_AI_WEIGHT_LOW_RELEVANCE = 0.1;
const RELEVANCE_GATE_THRESHOLD = 25;

const buildSkillPatterns = (skill) => {
  const names = [skill.name, ...(skill.synonyms || [])].filter(Boolean);
  const patterns = [];

  for (const name of names) {
    const normalized = normalizeSkillToken(name);
    if (!normalized) continue;
    patterns.push(new RegExp(`\\b${escapeRegExp(normalized).replace(/\s+/g, '\\s+')}\\b`, 'i'));

    const compact = normalized.replace(/\s+/g, '');
    if (compact.length >= 2) {
      patterns.push(new RegExp(`\\b${escapeRegExp(compact)}\\b`, 'i'));
    }

    const aliasList = ACRONYM_ALIASES[normalized] || [];
    for (const alias of aliasList) {
      patterns.push(new RegExp(`\\b${escapeRegExp(alias).replace(/\s+/g, '\\s+')}\\b`, 'i'));
    }

    // Compound skills like "On-Page SEO" may appear as "On-Page, Off-Page, Technical SEO".
    const tokens = normalized.split(/\s+/).filter(Boolean);
    if (tokens.length >= 2) {
      const [head, ...tail] = tokens;
      const tailPhrase = tail.join('\\s+');
      patterns.push(
        new RegExp(
          `\\b${escapeRegExp(head).replace(/\s+/g, '\\s+')}[\\s,/&-]+(?:\\w+[\\s,/&-]+){0,4}${tailPhrase}\\b`,
          'i'
        )
      );
    }
  }

  return patterns;
};

export const findTextOffset = (haystack, needle) => {
  if (!needle) return { charStart: -1, charEnd: -1 };

  const directIndex = haystack.indexOf(needle);
  if (directIndex >= 0) {
    return { charStart: directIndex, charEnd: directIndex + needle.length };
  }

  const pattern = new RegExp(escapeRegExp(needle).replace(/\s+/g, '\\s+'), 'i');
  const match = pattern.exec(haystack);
  if (match) {
    return { charStart: match.index, charEnd: match.index + match[0].length };
  }

  return { charStart: -1, charEnd: -1 };
};

export const skillMatchesResume = (resumeText, skill) => {
  const text = String(resumeText || '');
  const patterns = buildSkillPatterns(skill);
  const matchedPattern = patterns.find((pattern) => pattern.test(text));

  if (!matchedPattern) {
    return { matched: false, evidence: '' };
  }

  const match = text.match(matchedPattern);
  return {
    matched: true,
    evidence: match?.[0] || skill.name,
  };
};

export const computeSkillMatches = (resumeText, skills = []) => {
  const matchedSkillIds = [];
  const missingSkillIds = [];

  const enrichedSkills = skills.map((skill, index) => {
    const withId = {
      ...skill,
      id: resolveStoredSkillId(skill) || skill.id || createSkillId(skill.name, index),
    };
    const { matched, evidence } = skillMatchesResume(resumeText, withId);

    if (matched) {
      matchedSkillIds.push(withId.id);
    } else {
      missingSkillIds.push(withId.id);
    }

    return {
      ...withId,
      matched,
      matchEvidence: evidence,
    };
  });

  return {
    skills: enrichedSkills,
    matchedSkillIds,
    missingSkillIds,
  };
};

export const computeKeywordCoverageScore = (skills = []) => {
  const relevant = skills.filter((skill) => skill.type === 'required' || skill.type === 'hard');
  if (!relevant.length) return 0;
  const matched = relevant.filter((skill) => skill.matched).length;
  return clampScore((matched / relevant.length) * 100);
};

export const computeQuantifiedAchievementsScore = (resumeText = '') => {
  const lines = String(resumeText).split('\n');
  const metricPattern = /(\d+%|\$\d+|\d+\+?|\d+\s*(?:k|m|b)\b)/i;
  const metricLines = lines.filter((line) => metricPattern.test(line)).length;
  if (!metricLines) return 20;
  if (metricLines >= 5) return 95;
  if (metricLines >= 3) return 80;
  if (metricLines >= 1) return 60;
  return 30;
};

export const computeSectionCompletenessScore = (structuredSections = {}, resumeText = '') => {
  const text = resumeText.toLowerCase();
  let points = 0;

  if (structuredSections?.summary?.text || /summary|profile|objective/.test(text)) points += 25;
  if (structuredSections?.experience?.text || /experience|employment/.test(text)) points += 35;
  if (structuredSections?.education?.text || /education|university|bachelor|master/.test(text)) points += 20;
  if (structuredSections?.skills?.text || /skills|expertise|competencies/.test(text)) points += 20;

  return clampScore(points);
};

export const computeSearchabilityScore = (resumeText = '', searchabilityIssues = []) => {
  let score = 85;
  const text = resumeText.toLowerCase();

  if (!/@/.test(text)) score -= 15;
  if (!/(linkedin|github|phone|\d{3})/.test(text)) score -= 10;
  score -= Math.min(30, searchabilityIssues.length * 5);

  return clampScore(score);
};

export const computeAtsScore = ({
  resumeText = '',
  structuredSections = {},
  searchabilityIssues = [],
}) => {
  const sectionCompleteness = computeSectionCompletenessScore(structuredSections, resumeText);
  const searchability = computeSearchabilityScore(resumeText, searchabilityIssues);
  const quantifiedAchievements = computeQuantifiedAchievementsScore(resumeText);

  const atsScore = clampScore(
    sectionCompleteness * ATS_WEIGHTS.sectionCompleteness +
      searchability * ATS_WEIGHTS.searchability +
      quantifiedAchievements * ATS_WEIGHTS.quantifiedAchievements
  );

  return {
    atsScore,
    atsScoreBreakdown: {
      sectionCompleteness,
      searchability,
      quantifiedAchievements,
    },
  };
};

export const computeJobMatchScore = ({ skills = [], aiAssessedRelevance = 0 }) => {
  const keywordCoverage = computeKeywordCoverageScore(skills);
  const aiRelevance = clampScore(aiAssessedRelevance);
  const aiWeight =
    keywordCoverage < RELEVANCE_GATE_THRESHOLD
      ? JOB_MATCH_AI_WEIGHT_LOW_RELEVANCE
      : JOB_MATCH_AI_WEIGHT_DEFAULT;

  const blended = clampScore(
    keywordCoverage * JOB_MATCH_KEYWORD_WEIGHT + aiRelevance * aiWeight
  );

  let jobMatchScore = blended;
  if (keywordCoverage < RELEVANCE_GATE_THRESHOLD) {
    const gateCap = clampScore(keywordCoverage * 0.6 + 5);
    jobMatchScore = Math.min(blended, gateCap);
  }

  return {
    jobMatchScore,
    jobMatchBreakdown: {
      keywordCoverage,
      aiAssessedRelevance: aiRelevance,
    },
  };
};

export const computeAnalysisScores = ({
  resumeText = '',
  structuredSections = {},
  searchabilityIssues = [],
  skills = [],
  aiAssessedRelevance = 0,
}) => {
  const skillMatch = computeSkillMatches(resumeText, skills);
  const ats = computeAtsScore({ resumeText, structuredSections, searchabilityIssues });
  const jobMatch = computeJobMatchScore({
    skills: skillMatch.skills,
    aiAssessedRelevance,
  });

  return {
    ...ats,
    ...jobMatch,
    skills: skillMatch.skills,
    matchedSkillIds: skillMatch.matchedSkillIds,
    missingSkillIds: skillMatch.missingSkillIds,
  };
};

/** @deprecated Use computeAnalysisScores instead. */
export const blendAtsScore = (input) => {
  const result = computeAnalysisScores({
    resumeText: input.resumeText,
    structuredSections: input.structuredSections,
    searchabilityIssues: input.searchabilityIssues,
    skills: input.skills,
    aiAssessedRelevance: input.aiScore,
  });

  return {
    score: result.jobMatchScore,
    scoreBreakdown: {
      keywordCoverage: {
        score: result.jobMatchBreakdown.keywordCoverage,
        weight: 85,
        weighted: (result.jobMatchBreakdown.keywordCoverage * 85) / 100,
      },
      sectionCompleteness: {
        score: result.atsScoreBreakdown.sectionCompleteness,
        weight: 35,
        weighted: (result.atsScoreBreakdown.sectionCompleteness * 35) / 100,
      },
      searchability: {
        score: result.atsScoreBreakdown.searchability,
        weight: 35,
        weighted: (result.atsScoreBreakdown.searchability * 35) / 100,
      },
      quantifiedAchievements: {
        score: result.atsScoreBreakdown.quantifiedAchievements,
        weight: 30,
        weighted: (result.atsScoreBreakdown.quantifiedAchievements * 30) / 100,
      },
    },
    atsScore: result.atsScore,
    atsScoreBreakdown: result.atsScoreBreakdown,
    jobMatchScore: result.jobMatchScore,
    jobMatchBreakdown: result.jobMatchBreakdown,
  };
};

export const anchorSuggestionsToResume = (resumeText, suggestions = [], structuredResume = null) =>
  suggestions
    .map((suggestion, index) => {
      let fieldPath = String(suggestion.fieldPath || '').trim();
      if (!fieldPath && structuredResume) {
        fieldPath = findPathForOriginal(structuredResume, suggestion.original);
      }

      let charStart = -1;
      let charEnd = -1;

      if (fieldPath && structuredResume) {
        const fieldValue = String(getFieldByPath(structuredResume, fieldPath) ?? '');
        const offsets = findTextOffset(fieldValue, suggestion.original);
        charStart = offsets.charStart;
        charEnd = offsets.charEnd;
      } else {
        const offsets = findTextOffset(resumeText, suggestion.original);
        charStart = offsets.charStart;
        charEnd = offsets.charEnd;
      }

      if (charStart < 0 && suggestion.type !== 'missing_keyword' && !fieldPath) {
        return null;
      }

      return {
        ...suggestion,
        id: suggestion.id || createSuggestionId(index),
        status: 'pending',
        fieldPath,
        charStart,
        charEnd,
        targetSkillId: suggestion.targetSkillId || null,
      };
    })
    .filter(Boolean);

export const applySuggestionToText = (resumeText, suggestion) => {
  const text = String(resumeText || '');

  if (suggestion.charStart >= 0 && suggestion.charEnd > suggestion.charStart) {
    const before = text.slice(0, suggestion.charStart);
    const after = text.slice(suggestion.charEnd);
    const replacement = suggestion.type === 'remove' ? '' : suggestion.suggested;
    return `${before}${replacement}${after}`;
  }

  if (suggestion.original && text.includes(suggestion.original)) {
    const replacement = suggestion.type === 'remove' ? '' : suggestion.suggested;
    return text.replace(suggestion.original, replacement);
  }

  if (suggestion.type === 'missing_keyword' && suggestion.suggested) {
    return `${text}\n${suggestion.suggested}`.trim();
  }

  return text;
};

export const countSuggestionStats = (suggestions = []) => {
  const pending = suggestions.filter((item) => item.status === 'pending');
  const accepted = suggestions.filter((item) => item.status === 'accepted');
  return {
    total: suggestions.length,
    pending: pending.length,
    accepted: accepted.length,
  };
};

```

### FILE: `backend/src/utils/resumeScannerTextUtils.js`

```javascript
export const sanitizeResumeScannerText = (value = '') =>
  String(value)
    .replace(/<[^>]*>/g, '')
    .replace(/\u0000/g, '')
    .trim();

/** Mongoose subdocuments expose ObjectId via `.id`; read stored skill id safely. */
export const resolveStoredSkillId = (skill = {}) => {
  if (!skill) return '';

  if (typeof skill.get === 'function') {
    const explicitId = skill.get('id');
    if (explicitId && typeof explicitId === 'string' && explicitId.startsWith('skill-')) {
      return explicitId;
    }
  }

  const plain = typeof skill.toObject === 'function' ? skill.toObject({ virtuals: false }) : skill;
  const storedId = plain?.id || plain?.skillId || '';
  if (typeof storedId === 'string' && storedId.startsWith('skill-')) {
    return storedId;
  }

  return typeof storedId === 'string' ? storedId : '';
};

export const clampScore = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

export const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const normalizeSkillToken = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const createSkillId = (name, index = 0) => {
  const slug = normalizeSkillToken(name)
    .replace(/\s+/g, '-')
    .slice(0, 48);
  return `skill-${slug || 'item'}-${index + 1}`;
};

export const createSuggestionId = (index = 0) => `suggestion-${Date.now()}-${index + 1}`;

```

### FILE: `backend/src/utils/resumeScannerHistory.js`

```javascript
const cloneSuggestions = (suggestions = []) => suggestions.map((item) => ({ ...item }));

const cloneStructuredResume = (value) => {
  if (!value || typeof value !== 'object') {
    return {
      name: '',
      contact: { address: '', phone: '', email: '' },
      summary: '',
      workExperience: [],
      education: [],
      skills: [],
      languages: [],
    };
  }

  const plain = typeof value.toObject === 'function' ? value.toObject() : value;
  return JSON.parse(JSON.stringify(plain));
};

export const createHistorySnapshot = ({
  resumeText,
  structuredResume,
  suggestions,
  atsScore,
  jobMatchScore,
  atsScoreBreakdown,
  jobMatchBreakdown,
  matchedSkillIds,
  missingSkillIds,
  action,
}) => ({
  resumeText,
  structuredResume: cloneStructuredResume(structuredResume),
  suggestions: cloneSuggestions(suggestions),
  atsScore,
  jobMatchScore,
  score: jobMatchScore,
  atsScoreBreakdown: { ...(atsScoreBreakdown || {}) },
  jobMatchBreakdown: { ...(jobMatchBreakdown || {}) },
  matchedSkillIds: [...(matchedSkillIds || [])],
  missingSkillIds: [...(missingSkillIds || [])],
  action: action || 'edit',
  timestamp: new Date(),
});

export const pushHistoryEntry = (analysis, action = 'edit') => {
  const snapshot = createHistorySnapshot({
    resumeText: analysis.resumeText,
    structuredResume: analysis.structuredResume,
    suggestions: analysis.suggestions,
    atsScore: analysis.atsScore,
    jobMatchScore: analysis.jobMatchScore,
    atsScoreBreakdown: analysis.atsScoreBreakdown,
    jobMatchBreakdown: analysis.jobMatchBreakdown,
    matchedSkillIds: analysis.matchedSkillIds,
    missingSkillIds: analysis.missingSkillIds,
    action,
  });

  const truncated = analysis.history.slice(0, analysis.historyIndex + 1);
  truncated.push(snapshot);

  analysis.history = truncated;
  analysis.historyIndex = truncated.length - 1;
};

export const canUndo = (analysis) => analysis.historyIndex > 0;
export const canRedo = (analysis) =>
  analysis.historyIndex >= 0 && analysis.historyIndex < analysis.history.length - 1;

export const applyHistoryIndex = (analysis, index) => {
  const snapshot = analysis.history[index];
  if (!snapshot) return analysis;

  analysis.historyIndex = index;
  analysis.resumeText = snapshot.resumeText;
  analysis.structuredResume = cloneStructuredResume(snapshot.structuredResume);
  analysis.suggestions = cloneSuggestions(snapshot.suggestions);
  analysis.atsScore = snapshot.atsScore;
  analysis.jobMatchScore = snapshot.jobMatchScore;
  analysis.score = snapshot.jobMatchScore;
  analysis.atsScoreBreakdown = { ...(snapshot.atsScoreBreakdown || {}) };
  analysis.jobMatchBreakdown = { ...(snapshot.jobMatchBreakdown || {}) };
  analysis.matchedSkillIds = [...snapshot.matchedSkillIds];
  analysis.missingSkillIds = [...snapshot.missingSkillIds];

  return analysis;
};

export const undoAnalysis = (analysis) => {
  if (!canUndo(analysis)) return analysis;
  return applyHistoryIndex(analysis, analysis.historyIndex - 1);
};

export const redoAnalysis = (analysis) => {
  if (!canRedo(analysis)) return analysis;
  return applyHistoryIndex(analysis, analysis.historyIndex + 1);
};

export const initializeHistory = (analysis) => {
  const snapshot = createHistorySnapshot({
    resumeText: analysis.resumeText,
    structuredResume: analysis.structuredResume,
    suggestions: analysis.suggestions,
    atsScore: analysis.atsScore,
    jobMatchScore: analysis.jobMatchScore,
    atsScoreBreakdown: analysis.atsScoreBreakdown,
    jobMatchBreakdown: analysis.jobMatchBreakdown,
    matchedSkillIds: analysis.matchedSkillIds,
    missingSkillIds: analysis.missingSkillIds,
    action: 'initial',
  });

  analysis.history = [snapshot];
  analysis.historyIndex = 0;
  return analysis;
};

```

### FILE: `backend/src/utils/resumeScannerSerializer.js`

```javascript
import { countSuggestionStats } from './resumeScannerScoring.js';
import { resolveStoredSkillId } from './resumeScannerTextUtils.js';

const toPlainSkill = (skill = {}) => {
  const plain = typeof skill?.toObject === 'function' ? skill.toObject({ virtuals: false }) : skill;
  return {
    id: resolveStoredSkillId(skill) || plain.id || '',
    name: plain.name || plain.skillName || plain.label || plain.skill || '',
    type: plain.type || 'hard',
    synonyms: Array.isArray(plain.synonyms) ? plain.synonyms : [],
  };
};

const serializeSkill = (skill, jobDescription) => {
  const normalized = toPlainSkill(skill);
  const fromJob = jobDescription?.extractedSkills?.find(
    (item) => resolveStoredSkillId(item) === normalized.id
  );
  const jobPlain = fromJob ? toPlainSkill(fromJob) : null;

  return {
    id: normalized.id,
    name: normalized.name || jobPlain?.name || '',
    type: normalized.type || jobPlain?.type || 'hard',
    synonyms: normalized.synonyms.length ? normalized.synonyms : jobPlain?.synonyms || [],
    matched: Boolean(skill.matched),
    matchEvidence: skill.matchEvidence || '',
  };
};

export const serializeAtsAnalysis = (analysis, jobDescription = null) => {
  const skills = (jobDescription?.extractedSkills || []).map((skill) => {
    const plain = toPlainSkill(skill);
    const matched = analysis.matchedSkillIds?.includes(plain.id);
    return {
      ...plain,
      matched,
    };
  });

  const suggestionStats = countSuggestionStats(analysis.suggestions || []);
  const atsScore = analysis.atsScore ?? 0;
  const jobMatchScore = analysis.jobMatchScore ?? analysis.score ?? 0;

  return {
    analysisId: analysis._id,
    status: analysis.status,
    statusMessage: analysis.statusMessage,
    progress: analysis.progress,
    resumeSourceType: analysis.resumeSourceType,
    resumeSourceId: analysis.resumeSourceId,
    jobDescriptionId: analysis.jobDescriptionId,
    atsScore,
    atsScoreBreakdown: analysis.atsScoreBreakdown || {
      sectionCompleteness: 0,
      searchability: 0,
      quantifiedAchievements: 0,
    },
    jobMatchScore,
    jobMatchBreakdown: analysis.jobMatchBreakdown || {
      keywordCoverage: 0,
      aiAssessedRelevance: 0,
    },
    score: jobMatchScore,
    matchedSkills: skills.filter((skill) => skill.matched),
    missingSkills: skills.filter((skill) => !skill.matched),
    skills: skills.map((skill) => serializeSkill(skill, jobDescription)),
    matchedSkillIds: analysis.matchedSkillIds,
    missingSkillIds: analysis.missingSkillIds,
    resumeText: analysis.resumeText,
    originalResumeText: analysis.originalResumeText,
    lineMap: analysis.lineMap || [],
    structuredResume: analysis.structuredResume || {
      name: '',
      contact: { address: '', phone: '', email: '' },
      summary: '',
      workExperience: [],
      education: [],
      skills: [],
      languages: [],
    },
    structuredSections: analysis.structuredSections,
    suggestions: analysis.suggestions,
    searchabilityIssues: analysis.searchabilityIssues,
    recruiterTips: analysis.recruiterTips,
    coverLetter: analysis.coverLetter,
    jobDescription: jobDescription
      ? {
          id: jobDescription._id,
          title: jobDescription.title,
          company: jobDescription.company,
          rawText: jobDescription.rawText,
        }
      : null,
    suggestionStats,
    history: {
      canUndo: analysis.historyIndex > 0,
      canRedo:
        analysis.historyIndex >= 0 && analysis.historyIndex < (analysis.history?.length || 0) - 1,
    },
    createdAt: analysis.createdAt,
    updatedAt: analysis.updatedAt,
  };
};

```

### FILE: `backend/src/utils/resumeScannerStructuredSections.js`

```javascript
const SECTION_HEADER_SPECS = [
  {
    type: 'summary',
    keys: [
      'professional summary',
      'career summary',
      'executive summary',
      'about me',
      'summary',
      'profile',
      'objective',
    ],
  },
  {
    type: 'experience',
    keys: [
      'professional experience',
      'work experience',
      'employment history',
      'career history',
      'work history',
      'employment',
      'internships',
      'internship experience',
      'technical experience',
      'relevant experience',
      'experience',
    ],
  },
  {
    type: 'education',
    keys: [
      'academic background',
      'academic qualifications',
      'education',
      'academic',
      'qualifications',
    ],
  },
  {
    type: 'skills',
    keys: [
      'areas of expertise',
      'core competencies',
      'technical skills',
      'key skills',
      'skills',
      'expertise',
      'competencies',
    ],
  },
  { type: 'languages', keys: ['language proficiency', 'languages', 'language'] },
  {
    type: 'certifications',
    keys: ['certifications and courses', 'courses', 'training', 'certifications', 'certificates', 'licenses'],
  },
  {
    type: 'projects',
    keys: ['personal projects', 'technical projects', 'academic projects', 'key projects', 'projects'],
  },
  { type: 'awards', keys: ['achievements', 'honors', 'honours', 'awards'] },
  {
    type: 'volunteer',
    keys: ['volunteer experience', 'volunteering', 'memberships', 'organisations', 'organizations'],
  },
  { type: 'interests', keys: ['interests', 'hobbies'] },
  { type: 'references', keys: ['references'] },
];

const EXACT_ONLY_HEADER_KEYS = new Set([
  'profile',
  'experience',
  'competencies',
  'expertise',
  'skills',
  'education',
  'employment',
  'objective',
  'training',
  'courses',
  'projects',
  'languages',
  'language',
  'interests',
  'references',
  'awards',
  'academic',
  'qualifications',
  'internships',
  'certificates',
  'certifications',
  'licenses',
  'hobbies',
  'summary',
]);

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}(?:\s*(?:ext\.?|x)\s*\d+)?/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/\S+|github\.com\/\S+)/i;

const normalizeHeading = (line = '') =>
  line.trim().toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

export const detectPreviewSectionType = (line = '') => {
  const normalized = normalizeHeading(line);
  if (!normalized) return null;

  for (const spec of SECTION_HEADER_SPECS) {
    const keys = [...spec.keys].sort((a, b) => b.length - a.length);
    for (const key of keys) {
      if (EXACT_ONLY_HEADER_KEYS.has(key)) {
        if (normalized === key) return spec.type;
      } else if (normalized === key || normalized.startsWith(`${key} `)) {
        return spec.type;
      }
    }
  }

  return null;
};

const looksLikeContactLine = (line = '') => {
  const stripped = line.trim();
  if (!stripped) return false;
  if (EMAIL_RE.test(stripped)) return true;
  if (URL_RE.test(stripped)) return true;
  if (PHONE_RE.test(stripped) && (stripped.match(/\d/g) || []).length >= 7) return true;
  return false;
};

const splitSkillsItems = (text = '') => {
  const trimmed = text.trim();
  if (!trimmed) return [];

  let items = trimmed
    .split(/[,|\n•]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (items.length === 1) {
    items = trimmed
      .split(/\s{2,}|\s+and\s+|(?<=[a-z])\s+(?=[A-Z])/)
      .map((token) => token.trim())
      .filter((token) => token && token.length > 1 && token.length < 120);
  }

  return items;
};

const emptyStructuredSections = () => ({
  contact: {
    name: '',
    headline: '',
    lines: [],
    text: '',
  },
  summary: { text: '', paragraphs: [] },
  experience: { text: '', paragraphs: [] },
  education: { text: '', paragraphs: [] },
  skills: { text: '', items: [], paragraphs: [] },
  additional_sections: [],
  unassigned: { text: '' },
});

/**
 * Rebuild Preview-ready structured sections from ATS resume text.
 * Shape matches python-service/resume_extractor.parse_structured_sections.
 */
export const parseStructuredSectionsFromText = (fullText = '') => {
  const text = String(fullText || '').replace(/\r\n/g, '\n').trim();
  if (!text) return emptyStructuredSections();

  const rawLines = text.split('\n');
  const sections = [];
  let current = null;
  const contactLines = [];
  const headerLines = [];
  let firstSectionIndex = null;

  rawLines.forEach((line, index) => {
    const sectionType = detectPreviewSectionType(line);

    if (sectionType) {
      if (firstSectionIndex === null) firstSectionIndex = index;
      if (current) sections.push(current);
      current = { type: sectionType, heading: line.trim(), lines: [] };
      return;
    }

    if (current) {
      current.lines.push(line);
      return;
    }

    if (firstSectionIndex === null) {
      if (looksLikeContactLine(line)) {
        contactLines.push(line);
      } else if (line.trim()) {
        headerLines.push(line);
      }
    }
  });

  if (current) sections.push(current);

  let resolvedContactLines = contactLines;
  let resolvedHeaderLines = headerLines;

  if (firstSectionIndex === null) {
    resolvedContactLines = rawLines.filter((line) => looksLikeContactLine(line));
    resolvedHeaderLines = rawLines.filter((line) => line.trim() && !looksLikeContactLine(line));
  }

  const structured = emptyStructuredSections();
  structured.contact = {
    name: resolvedHeaderLines[0]?.trim() || '',
    headline: resolvedHeaderLines[1]?.trim() || '',
    lines: resolvedContactLines.map((line) => line.trim()).filter(Boolean),
    text: resolvedContactLines.join('\n').trim(),
  };

  for (const section of sections) {
    const body = section.lines.join('\n').trim();
    const paragraphs = body
      .split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean);
    const payload = {
      heading: section.heading,
      text: body,
      paragraphs: paragraphs.length ? paragraphs : body ? [body] : [],
    };

    if (section.type === 'summary') {
      structured.summary = payload;
    } else if (section.type === 'experience') {
      structured.experience = payload;
    } else if (section.type === 'education') {
      structured.education = payload;
    } else if (section.type === 'skills') {
      structured.skills = {
        ...payload,
        items: splitSkillsItems(body),
      };
    } else {
      structured.additional_sections.push({ type: section.type, ...payload });
    }
  }

  if (firstSectionIndex === null && resolvedHeaderLines.length) {
    structured.unassigned.text = [...resolvedHeaderLines.slice(2), ...rawLines].join('\n').trim();
  }

  const hasCanonicalContent =
    structured.contact.name ||
    structured.summary.text ||
    structured.experience.text ||
    structured.education.text ||
    structured.skills.text ||
    structured.additional_sections.length > 0;

  // Safety net: never return a fully empty structure when resume text exists
  // (contentEditable edits can collapse headers and break section detection).
  if (!hasCanonicalContent && text) {
    if (!structured.contact.name && resolvedHeaderLines[0]) {
      structured.contact.name = resolvedHeaderLines[0].trim();
      structured.contact.headline = resolvedHeaderLines[1]?.trim() || structured.contact.headline;
    }
    if (!structured.unassigned.text) {
      structured.unassigned.text = text;
    }
  }

  return structured;
};

```

### FILE: `backend/src/utils/resumeLineMapUtils.js`

```javascript
export const buildResumeTextFromLineMap = (lineMap = []) => {
  if (!Array.isArray(lineMap) || lineMap.length === 0) {
    return '';
  }

  return [...lineMap]
    .sort((left, right) => (left.line_number ?? 0) - (right.line_number ?? 0))
    .map((line) => (line?.text == null ? '' : String(line.text)))
    .join('\n')
    .trimEnd();
};

export const resolveCanonicalResumeText = ({ resumeText = '', lineMap = [] } = {}) => {
  // Prefer ATS-normalized resumeText (has intentional section newlines).
  // lineMap is only a fallback when resumeText is missing.
  const fromResume = String(resumeText || '').trimEnd();
  if (fromResume) {
    return fromResume;
  }

  return buildResumeTextFromLineMap(lineMap);
};

```

## 10. BACKEND — App Mount

### FILE: `backend/src/utils/pythonExtractorService.js`

```javascript
import { cleanExtractedText, duplicatePenalty } from './resumeTextCleanup.js';
import { prepareResumeTextForImport, scoreResumeTextQuality } from './resumeTextNormalizer.js';

const DEFAULT_PYTHON_SERVICE_URL = 'http://localhost:8000';
const EXTRACT_TIMEOUT_MS = 120_000;

const getPythonServiceUrl = () =>
  (process.env.PYTHON_SERVICE_URL || DEFAULT_PYTHON_SERVICE_URL).replace(/\/$/, '');

const buildFallbackResult = (type, fullText, source = 'fallback', pageTexts = []) => {
  const normalizedPages = (pageTexts || [])
    .map((item) => ({
      page: item.page ?? item.pageNumber ?? 1,
      text: item.text || '',
    }))
    .filter((item) => item.text.trim());

  return {
    success: Boolean(fullText?.trim()),
    type,
    pages: normalizedPages.length || (fullText?.trim() ? 1 : 0),
    page_texts: normalizedPages,
    chunks: fullText?.trim()
      ? [{ text: fullText.trim(), page: normalizedPages[0]?.page || 1, metadata: { chunk_index: 0, source } }]
      : [],
    full_text: fullText || '',
    metadata: {
      title: '',
      author: '',
      pages: normalizedPages.length || (fullText?.trim() ? 1 : 0),
      source,
    },
    source,
  };
};

export const extractPdfWithPythonService = async (buffer, type = 'resume') => {
  if (!buffer?.length) {
    throw new Error('PDF buffer is required.');
  }

  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: 'application/pdf' }), 'document.pdf');
  formData.append('type', type);

  const headers = {};
  const apiKey = process.env.PYTHON_SERVICE_API_KEY?.trim();
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const response = await fetch(`${getPythonServiceUrl()}/extract`, {
    method: 'POST',
    body: formData,
    headers,
    signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Python extractor returned ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  if (!data?.success) {
    throw new Error('Python extractor reported failure.');
  }

  return {
    ...data,
    source: 'python',
  };
};

export const extractPdfWithPythonOrFallback = async (buffer, type = 'resume', fallbackFn) => {
  let pythonResult = null;
  let fallbackResult = null;

  try {
    pythonResult = await extractPdfWithPythonService(buffer, type);
  } catch (error) {
    console.warn('[pdf-extract] Python service unavailable, using fallback:', error.message);
  }

  if (typeof fallbackFn === 'function') {
    try {
      const fallbackRaw = await fallbackFn(buffer);
      const fallbackText =
        typeof fallbackRaw === 'string' ? fallbackRaw : fallbackRaw?.text || '';
      const fallbackPages =
        typeof fallbackRaw === 'object' && Array.isArray(fallbackRaw?.pages)
          ? fallbackRaw.pages.map((page) => ({
              page: page.pageNumber ?? page.page ?? 1,
              text: page.text || '',
            }))
          : [];

      fallbackResult = buildFallbackResult(type, fallbackText, 'fallback', fallbackPages);
    } catch (error) {
      console.warn('[pdf-extract] Fallback extractor failed:', error.message);
    }
  }

  const scoreCandidate = (text = '') => {
    const prepared = prepareResumeTextForImport(text);
    return scoreResumeTextQuality(prepared) - duplicatePenalty(prepared);
  };

  const pythonText = pythonResult?.full_text || '';
  const fallbackText = fallbackResult?.full_text || '';

  if (pythonText.trim() && fallbackText.trim()) {
    const pythonScore = scoreCandidate(pythonText);
    const fallbackScore = scoreCandidate(fallbackText);

    if (fallbackScore > pythonScore + 10) {
      console.warn(
        `[pdf-extract] Using pdf-parse fallback (score ${fallbackScore} vs python ${pythonScore}).`
      );
      return fallbackResult;
    }

    return {
      ...pythonResult,
      source: 'python',
    };
  }

  if (pythonText.trim()) {
    return pythonResult;
  }

  if (fallbackText.trim()) {
    return fallbackResult;
  }

  return buildFallbackResult(type, '');
};

export const extractResumeWithPythonService = async (buffer, filename = 'resume.pdf') => {
  if (!buffer?.length) {
    throw new Error('Resume buffer is required.');
  }

  const extension = filename.toLowerCase().endsWith('.docx') ? 'docx' : 'pdf';
  const mimeType =
    extension === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

  const formData = new FormData();
  formData.append('file', new Blob([buffer], { type: mimeType }), filename);

  const headers = {};
  const apiKey = process.env.PYTHON_SERVICE_API_KEY?.trim();
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }

  const response = await fetch(`${getPythonServiceUrl()}/extract-resume`, {
    method: 'POST',
    body: formData,
    headers,
    signal: AbortSignal.timeout(EXTRACT_TIMEOUT_MS),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Python resume extractor returned ${response.status}: ${errorBody}`);
  }

  const data = await response.json();

  if (!data?.success) {
    throw new Error('Python resume extractor reported failure.');
  }

  return {
    ...data,
    source: 'python',
  };
};

```

## 11. PYTHON SERVICE

### FILE: `backend/src/utils/resumeFileExtractor.js`

```javascript
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { ERROR_CODES } from '../constants/apiErrorCodes.js';
import { AppError } from './sendResponse.js';
import { extractPdfWithPythonOrFallback } from './pythonExtractorService.js';
import { cleanExtractedText } from './resumeTextCleanup.js';
import { scoreResumeTextQuality } from './resumeTextNormalizer.js';

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg']);

const isImageMime = (mimetype) => IMAGE_MIME_TYPES.has(mimetype);

const PDF_STRATEGIES = [
  { lineEnforce: true, lineThreshold: 4.6, cellSeparator: '\t', cellThreshold: 10 },
  { lineEnforce: true, lineThreshold: 7.5, cellSeparator: '\n', cellThreshold: 10 },
  { lineEnforce: true, lineThreshold: 3.2, cellSeparator: ' | ', cellThreshold: 10 },
  { lineEnforce: false },
];

const mapPagesFromExtraction = (extraction = {}) => {
  if (Array.isArray(extraction.page_texts) && extraction.page_texts.length) {
    return extraction.page_texts.map((item) => ({
      pageNumber: item.page ?? item.pageNumber ?? 1,
      text: item.text || '',
    }));
  }

  const byPage = new Map();

  for (const chunk of extraction.chunks || []) {
    const pageNumber = chunk.page || 1;
    const chunkText = chunk.text?.trim() || '';
    if (!chunkText) continue;

    const existing = byPage.get(pageNumber) || '';
    byPage.set(pageNumber, existing ? `${existing}\n${chunkText}` : chunkText);
  }

  return [...byPage.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([pageNumber, text]) => ({ pageNumber, text }));
};

const toPagesText = (pages = []) =>
  pages.map((page) => ({
    page: page.pageNumber,
    text: page.text,
  }));

let lastResumeFileExtraction = null;

export const getLastResumeFileExtraction = () => lastResumeFileExtraction;

export const extractPdfTextFallback = async (buffer) => {
  const parser = new PDFParse({ data: buffer });

  try {
    const candidates = [];

    for (const strategy of PDF_STRATEGIES) {
      try {
        const result = await parser.getText(strategy);
        const text = result.text?.trim();
        if (!text) continue;

        const pages = (result.pages || [])
          .map((page) => ({
            pageNumber: page.num ?? page.pageNumber ?? 1,
            text: page.text?.trim() || '',
          }))
          .filter((page) => page.text);

        candidates.push({
          text,
          pages,
          score: scoreResumeTextQuality(cleanExtractedText(text)),
        });
      } catch {
        // Strategy failed — try next
      }
    }

    if (candidates.length === 0) {
      return { text: '', pages: [] };
    }

    const best = candidates.sort((a, b) => b.score - a.score)[0];

    return {
      text: best.text,
      pages: best.pages,
    };
  } catch (error) {
    console.warn('[resume-import] pdf-parse fallback failed:', error.message);
    return { text: '', pages: [] };
  } finally {
    await parser.destroy();
  }
};

export const extractResumeTextFromFile = async (file) => {
  if (!file?.buffer) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.FILE_REQUIRED, 400);
  }

  if (isImageMime(file.mimetype)) {
    throw new AppError(ERROR_CODES.RESUME_BUILDER.IMAGE_NOT_SUPPORTED, 400);
  }

  if (file.mimetype === 'application/pdf') {
    const extraction = await extractPdfWithPythonOrFallback(
      file.buffer,
      'resume',
      extractPdfTextFallback
    );
    const text = cleanExtractedText(extraction.full_text || '');
    const pages = mapPagesFromExtraction(extraction);

    if (!text) {
      throw new AppError(ERROR_CODES.RESUME_BUILDER.PDF_EXTRACT_FAILED, 400);
    }

    // Both conditions must be true: low quality score AND very short text.
    // Minimal CVs without dates/email can score low but still have enough content.
    if (scoreResumeTextQuality(text) < 2 && text.length < 80) {
      throw new AppError(ERROR_CODES.RESUME_BUILDER.PDF_SCANNED, 400);
    }

    lastResumeFileExtraction = {
      text,
      pages,
      pages_text: toPagesText(pages),
      pages_count: extraction.pages || pages.length || 0,
      source: extraction.source || 'unknown',
    };

    return text;
  }

  if (
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.mimetype === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    const text = cleanExtractedText(result.value?.trim() || '');

    if (!text) {
      throw new AppError(ERROR_CODES.RESUME_BUILDER.DOCX_EXTRACT_FAILED, 400);
    }

    lastResumeFileExtraction = {
      text,
      pages: [{ pageNumber: 1, text }],
      pages_text: [{ page: 1, text }],
      pages_count: 1,
      source: 'docx',
    };

    return text;
  }

  throw new AppError(ERROR_CODES.RESUME_BUILDER.UNSUPPORTED_FILE_TYPE, 400);
};

```

### FILE: `backend/src/app.js`

```javascript
import cors from 'cors';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import passport from 'passport';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import { configurePassport } from './config/passport.js';
import apiRoutes from './routes/apiRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import socialAuthRoutes from './routes/socialAuthRoutes.js';
import verifyRoutes from './routes/verifyRoutes.js';
import resumeBuilderRoutes from './routes/resumeBuilderRoutes.js';
import skillQuizRoutes from './routes/skillQuizRoutes.js';
import mockInterviewRoutes from './routes/mockInterviewRoutes.js';
import voiceAnalysisRoutes from './routes/voiceAnalysisRoutes.js';
import videoAnalysisRoutes from './routes/videoAnalysisRoutes.js';
import resumeScannerRoutes from './routes/resumeScannerRoutes.js';
import { ERROR_CODES, getErrorMessage } from './constants/apiErrorCodes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

connectDB();
configurePassport();

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.set('trust proxy', 1);

app.disable('x-powered-by');
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

const createCodedRateLimiter = ({ windowMs, max, code, skip }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    handler: (req, res) => {
      const resetTime = req.rateLimit?.resetTime;
      let retryAfterSeconds = Math.max(1, Math.ceil(windowMs / 1000));

      if (resetTime instanceof Date) {
        retryAfterSeconds = Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
      }

      res.set('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        success: false,
        code,
        params: {},
        message: getErrorMessage(code),
        retryAfterSeconds,
      });
    },
  });

const authLimiter = createCodedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
  code: ERROR_CODES.RATE_LIMIT.AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (['/social/exchange', '/social/status'].includes(req.path)) {
      return true;
    }

    if (req.method !== 'GET') return false;
    if (['/google', '/facebook', '/linkedin'].includes(req.path)) return true;
    if (
      [
        '/google/callback',
        '/facebook/callback',
        '/linkedin/callback',
        '/social/callback',
        '/social/google',
        '/social/facebook',
        '/social/linkedin',
        '/social/google/callback',
        '/social/facebook/callback',
        '/social/linkedin/callback',
      ].includes(req.path)
    ) {
      return true;
    }
    return false;
  },
});

const socialOAuthLimiter = createCodedRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 60,
  code: ERROR_CODES.RATE_LIMIT.SOCIAL_AUTH,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    if (req.method !== 'GET') return false;
    if (req.path === '/status') return true;
    if (['/google', '/facebook', '/linkedin'].includes(req.path)) return true;
    if (['/google/callback', '/facebook/callback', '/linkedin/callback'].includes(req.path)) {
      return true;
    }
    if (req.path === '/social/callback') return true;
    if (
      [
        '/social/google',
        '/social/facebook',
        '/social/linkedin',
        '/social/google/callback',
        '/social/facebook/callback',
        '/social/linkedin/callback',
      ].includes(req.path)
    ) {
      return true;
    }
    return false;
  },
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(passport.initialize());

app.get('/', (_req, res) => {
  res.json({ message: 'Welcome to AI CareerBridge API' });
});

app.use('/api', apiRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', userRoutes);
app.use('/api', resumeBuilderRoutes);
app.use('/api', skillQuizRoutes);
app.use('/api', mockInterviewRoutes);
app.use('/api', voiceAnalysisRoutes);
app.use('/api', videoAnalysisRoutes);
app.use('/api', resumeScannerRoutes);
app.use('/api', verifyRoutes);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/auth', socialOAuthLimiter, socialAuthRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;

```

### FILE: `python-service/main.py`

```python
import os
from pathlib import Path

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

from chunker import chunk_text
from extractor import extract_pdf
from resume_extractor import ALLOWED_RESUME_EXTENSIONS, extract_resume_bytes

app = FastAPI(title="AI CareerBridge PDF Extractor", version="1.1.0")

# Only the Node backend should call this service (server-to-server).
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("PYTHON_SERVICE_CORS_ORIGINS", "http://localhost:5000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"resume", "job_description"}
MAX_UPLOAD_BYTES = int(os.getenv("PYTHON_SERVICE_MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))
MAX_PAGES = int(os.getenv("PYTHON_SERVICE_MAX_PAGES", "50"))
SERVICE_API_KEY = os.getenv("PYTHON_SERVICE_API_KEY", "").strip()


async def require_service_api_key(
    x_api_key: str | None = Header(default=None, alias="X-API-Key"),
):
    if not SERVICE_API_KEY:
        # Misconfigured deployment — refuse rather than run open.
        raise HTTPException(
            status_code=503,
            detail="PYTHON_SERVICE_API_KEY is not configured on the extractor service.",
        )
    if not x_api_key or x_api_key != SERVICE_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized.")


@app.get("/")
async def root():
    return {
        "service": "AI CareerBridge PDF Extractor",
        "status": "running",
        "endpoints": {
            "health": "GET /health",
            "extract": "POST /extract (multipart: file, type=resume|job_description)",
            "extract_resume": "POST /extract-resume (multipart: file — PDF or DOCX)",
        },
    }


@app.get("/health")
async def health():
    return {"status": "ok", "auth_configured": bool(SERVICE_API_KEY)}


@app.post("/extract", dependencies=[Depends(require_service_api_key)])
async def extract(
    file: UploadFile = File(...),
    type: str = Form(...),
):
    if type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type '{type}'. Must be one of: {', '.join(sorted(ALLOWED_TYPES))}",
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    pdf_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(pdf_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"PDF exceeds maximum size of {MAX_UPLOAD_BYTES} bytes.",
        )
    if not pdf_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File is not a valid PDF.")

    try:
        extraction = extract_pdf(pdf_bytes)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF extraction failed: {exc}") from exc

    pages = int(extraction.get("pages") or 0)
    if pages > MAX_PAGES:
        raise HTTPException(
            status_code=400,
            detail=f"PDF has too many pages ({pages}). Maximum allowed is {MAX_PAGES}.",
        )

    chunks = chunk_text(
        extraction["full_text"],
        page_texts=extraction["page_texts"],
        chunk_size=800,
        overlap=100,
    )

    response_chunks = [
        {
            "text": chunk["text"],
            "page": chunk["page"],
            "metadata": chunk.get("metadata", {}),
        }
        for chunk in chunks
    ]

    if not response_chunks and extraction["full_text"]:
        response_chunks = [{"text": extraction["full_text"], "page": 1, "metadata": {"chunk_index": 0}}]

    return {
        "success": True,
        "type": type,
        "pages": extraction["pages"],
        "chunks": response_chunks,
        "full_text": extraction["full_text"],
        "metadata": extraction["metadata"],
    }


@app.post("/extract-resume", dependencies=[Depends(require_service_api_key)])
async def extract_resume(file: UploadFile = File(...)):
    filename = (file.filename or "").strip()
    extension = f".{filename.rsplit('.', 1)[-1].lower()}" if "." in filename else ""

    if extension not in ALLOWED_RESUME_EXTENSIONS:
        supported = ", ".join(sorted(ext.lstrip(".") for ext in ALLOWED_RESUME_EXTENSIONS))
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed formats: {supported}.",
        )

    file_bytes = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum size of {MAX_UPLOAD_BYTES} bytes.",
        )
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        result = extract_resume_bytes(file_bytes, filename)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Resume extraction failed: {exc}") from exc

    pages = int(result.get("pages") or 0)
    if extension == ".pdf" and pages > MAX_PAGES:
        raise HTTPException(
            status_code=400,
            detail=f"PDF has too many pages ({pages}). Maximum allowed is {MAX_PAGES}.",
        )

    return result

```

### FILE: `python-service/extractor.py`

```python
import io
import os
import gc
import logging
import re
import subprocess
import tempfile
from typing import Any

import fitz
import pdfplumber
import pytesseract
from pdf2image import convert_from_bytes

from cleaner import _normalize_for_compare, clean_text
from platform_config import POPPLER_BIN, configure_platform_tools

configure_platform_tools()

logger = logging.getLogger(__name__)

# =========================
# CONFIG
# =========================
MIN_PAGE_TEXT = 50
MIN_DIGITAL_TEXT_FOR_SKIP_TABLES = 180
MAX_PDF_SIZE_MB = 50
MAX_PAGES = 500
OCR_DPI = 250
OCR_LANG = "eng"
OCR_TIMEOUT = 30

# Matches bullet markers: -, •, *, ‣, ▪, ◦, or numbered/lettered lists (1. / 1) / a.)
BULLET_RE = re.compile(r"^(?:[-•*‣▪◦]|\d+[.)]|[a-zA-Z][.)])\s+")
SECTION_HEADING_NAMES = (
    "PROFESSIONAL SUMMARY",
    "CAREER SUMMARY",
    "EXECUTIVE SUMMARY",
    "WORK EXPERIENCE",
    "PROFESSIONAL EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "CORE COMPETENCIES",
    "TECHNICAL SKILLS",
    "KEY SKILLS",
    "CERTIFICATIONS",
    "PROJECTS",
    "LANGUAGES",
    "EDUCATION",
    "SUMMARY",
    "EXPERIENCE",
    "SKILLS",
    "AWARDS",
    "INTERESTS",
    "REFERENCES",
)
_SECTION_HEADING_ALT = "|".join(re.escape(name) for name in SECTION_HEADING_NAMES)
INLINE_SECTION_HEADING_RE = re.compile(
    rf"^(?P<heading>{_SECTION_HEADING_ALT})\s+(?P<body>.+)$",
    re.IGNORECASE,
)
STANDALONE_SECTION_HEADING_RE = re.compile(
    rf"^(?P<heading>{_SECTION_HEADING_ALT})\s*$",
    re.IGNORECASE,
)


def _is_section_heading_line(line: str) -> bool:
    """True for standalone headings or 'HEADING rest of line' inline forms."""
    stripped = line.strip()
    if not stripped:
        return False
    return bool(
        STANDALONE_SECTION_HEADING_RE.match(stripped)
        or INLINE_SECTION_HEADING_RE.match(stripped)
    )


# =========================
# PDF FONT CHECK
# =========================
def _run_pdffonts(pdf_bytes: bytes) -> bool | None:
    """
    Detect if PDF contains fonts.
    """
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            suffix=".pdf",
            delete=False
        ) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
        result = subprocess.run(
            [
                "pdffonts",
                tmp_path
            ],
            capture_output=True,
            text=True,
            timeout=30,
            check=False
        )
        if result.returncode != 0:
            return None
        lines = [
            x.strip()
            for x in result.stdout.splitlines()
            if x.strip()
        ]
        if len(lines) <= 2:
            return False
        return True
    except (
        FileNotFoundError,
        subprocess.SubprocessError
    ):
        return None
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


# =========================
# REAL TEXT DETECTION
# =========================
def _has_real_text(doc: fitz.Document) -> bool:
    chars = 0
    try:
        for page in doc:
            chars += len(
                page.get_text().strip()
            )
            if chars > MIN_PAGE_TEXT:
                return True
    except Exception as e:
        logger.warning(
            "Text detection failed",
            exc_info=e
        )
    return False


# =========================
# OCR
# =========================
def _ocr_page(
    pdf_bytes: bytes,
    page_index: int
) -> str:
    images = []
    try:
        kwargs = {
            "dpi": OCR_DPI,
            "first_page": page_index + 1,
            "last_page": page_index + 1
        }
        if POPPLER_BIN:
            kwargs["poppler_path"] = POPPLER_BIN
        images = convert_from_bytes(
            pdf_bytes,
            **kwargs
        )
        if not images:
            return ""
        text = pytesseract.image_to_string(
            images[0],
            lang=OCR_LANG,
            timeout=OCR_TIMEOUT
        )
        return text or ""
    except RuntimeError as e:
        logger.warning(
            "OCR timeout page=%s",
            page_index + 1
        )
        return ""
    except Exception as e:
        logger.error(
            "OCR failed",
            exc_info=e
        )
        return ""
    finally:
        for img in images:
            try:
                img.close()
            except Exception:
                pass
        gc.collect()


# =========================
# TABLE EXTRACTION
# =========================
def _extract_tables_for_page(
    pdf_bytes: bytes,
    page_index: int
) -> str:
    blocks = []
    try:
        with pdfplumber.open(
            io.BytesIO(pdf_bytes)
        ) as pdf:
            if page_index >= len(pdf.pages):
                return ""
            page = pdf.pages[page_index]
            tables = page.extract_tables() or []
            for table in tables:
                for row in table:
                    cells = [
                        str(cell).strip()
                        for cell in row
                        if cell
                        and str(cell).strip()
                    ]
                    if cells:
                        blocks.append(
                            " | ".join(cells)
                        )
    except Exception as e:
        logger.warning(
            "Table extraction failed",
            exc_info=e
        )
    return "\n".join(blocks)


# =========================
# WRAPPED-LINE MERGING (NEW)
# =========================
def _split_inline_section_headings(line: str) -> list[str]:
    """Split 'WORK EXPERIENCE Senior Engineer...' back into heading + body lines."""
    match = INLINE_SECTION_HEADING_RE.match(line.strip())
    if not match:
        return [line]

    heading = match.group("heading").strip().upper()
    body = match.group("body").strip()
    if not body:
        return [heading]
    return [heading, body]


def _merge_wrapped_lines_in_paragraph(text: str) -> str:
    """Collapse visual wrap-only newlines inside a single paragraph block.

    Never merges across section headings — otherwise ATS structure collapses into
    run-on lines like "PROFESSIONAL SUMMARY Results... WORK EXPERIENCE Acme".
    """
    raw_lines = [line.strip() for line in text.split("\n")]
    merged: list[str] = []

    for line in raw_lines:
        if not line:
            continue

        is_bullet = bool(BULLET_RE.match(line))
        if _is_section_heading_line(line):
            merged.append(line)
            continue

        if (
            merged
            and not is_bullet
            and not BULLET_RE.match(merged[-1])
            and not _is_section_heading_line(merged[-1])
        ):
            merged[-1] = f"{merged[-1]} {line}"
        else:
            merged.append(line)

    return "\n".join(merged)


def _merge_wrapped_lines(text: str) -> str:
    """
    PyMuPDF preserves visual line wraps as literal newlines inside a text block.
    Merge wrap-only breaks within each paragraph (split on blank lines), while
    keeping real paragraph boundaries and bullet items separate.
    """
    paragraphs = re.split(r"\n\s*\n", text)
    merged_paragraphs: list[str] = []

    for paragraph in paragraphs:
        merged = _merge_wrapped_lines_in_paragraph(paragraph)
        if not merged.strip():
            continue

        split_lines: list[str] = []
        for line in merged.split("\n"):
            split_lines.extend(_split_inline_section_headings(line))

        merged_paragraphs.append("\n".join(split_lines))

    return "\n\n".join(merged_paragraphs)


# =========================
# FITZ TEXT + LAYOUT
# =========================
def _extract_page_with_fitz(
    doc: fitz.Document,
    page_index: int
) -> str:
    page = doc.load_page(page_index)
    try:
        blocks = page.get_text(
            "blocks",
            sort=True
        )
        parts = []
        for block in blocks:
            if len(block) < 5:
                continue
            if len(block) >= 7 and block[6] != 0:
                continue
            text = str(
                block[4]
            ).strip()
            if text:
                parts.append(_merge_wrapped_lines(text))
        if parts:
            return "\n\n".join(parts)
    except Exception as e:
        logger.warning(
            "Fitz extraction failed",
            exc_info=e
        )
    return page.get_text("text")


# =========================
# MERGE
# =========================
def _merge_page_text(
    primary: str,
    tables: str
) -> str:
    primary = primary.strip()
    tables = tables.strip()
    if not tables:
        return primary
    if len(primary) >= MIN_DIGITAL_TEXT_FOR_SKIP_TABLES:
        return primary
    primary_norm = _normalize_for_compare(
        primary
    )
    extra = []
    for line in tables.split("\n"):
        norm = _normalize_for_compare(
            line
        )
        if norm and norm not in primary_norm:
            extra.append(line)
    if not extra:
        return primary
    return (
        primary
        + "\n"
        + "\n".join(extra)
    )


# =========================
# MAIN EXTRACTION
# =========================
def extract_pdf(
    pdf_bytes: bytes
) -> dict[str, Any]:
    # Security checks
    size_mb = len(pdf_bytes) / (
        1024 * 1024
    )
    if size_mb > MAX_PDF_SIZE_MB:
        raise ValueError(
            "PDF too large"
        )
    try:
        doc = fitz.open(
            stream=pdf_bytes,
            filetype="pdf"
        )
    except Exception as e:
        raise ValueError(
            "Invalid PDF"
        ) from e
    page_count = doc.page_count
    if page_count > MAX_PAGES:
        doc.close()
        raise ValueError(
            "Too many pages"
        )
    has_fonts = _run_pdffonts(
        pdf_bytes
    )
    real_text = _has_real_text(
        doc
    )
    scanned_document = not real_text
    page_texts = []
    for index in range(page_count):
        source = "digital"
        if scanned_document:
            text = _ocr_page(
                pdf_bytes,
                index
            )
            source = "ocr"
        else:
            fitz_text = _extract_page_with_fitz(
                doc,
                index
            )
            tables = _extract_tables_for_page(
                pdf_bytes,
                index
            )
            text = _merge_page_text(
                fitz_text,
                tables
            )
            if len(text.strip()) < MIN_PAGE_TEXT:
                ocr = _ocr_page(
                    pdf_bytes,
                    index
                )
                if len(ocr.strip()) > len(text.strip()):
                    text = ocr
                    source = "ocr"
        page_texts.append(
            {
                "page": index + 1,
                "text": clean_text(text),
                "source": source
            }
        )
    doc.close()
    full_text = clean_text(
        "\n\n".join(
            x["text"]
            for x in page_texts
            if x["text"]
        )
    )
    metadata = {
        "title": "",
        "author": "",
        "pages": page_count,
        "has_text_layer": has_fonts,
        "extraction_mode":
            (
                "scanned"
                if scanned_document
                else
                "mixed"
                if any(
                    x["source"] == "ocr"
                    for x in page_texts
                )
                else
                "digital"
            )
    }
    try:
        meta_doc = fitz.open(
            stream=pdf_bytes,
            filetype="pdf"
        )
        meta = meta_doc.metadata or {}
        metadata["title"] = (
            meta.get("title")
            or ""
        )
        metadata["author"] = (
            meta.get("author")
            or ""
        )
        meta_doc.close()
    except Exception as e:
        logger.warning(
            "Metadata failed",
            exc_info=e
        )
    return {
        "pages": page_count,
        "page_texts": page_texts,
        "full_text": full_text,
        "metadata": metadata
    }

```

### FILE: `python-service/ats_normalizer.py`

```python
"""
Rule-based ATS normalizer.
Rebuilds resume text in a canonical single-column ATS order from structured
sections produced by resume_extractor.parse_structured_sections.
"""
from __future__ import annotations

import re
from typing import Any

from resume_extractor import parse_structured_sections

CANONICAL_SECTIONS: list[tuple[str, str]] = [
    ("summary", "PROFESSIONAL SUMMARY"),
    ("experience", "WORK EXPERIENCE"),
    ("education", "EDUCATION"),
    ("skills", "SKILLS"),
]

ADDITIONAL_SECTION_HEADINGS: dict[str, str] = {
    "certifications": "CERTIFICATIONS",
    "projects": "PROJECTS",
    "languages": "LANGUAGES",
    "awards": "AWARDS",
    "volunteer": "VOLUNTEER EXPERIENCE",
    "interests": "INTERESTS",
    "references": "REFERENCES",
}

TABLE_PIPE_RE = re.compile(r"\s*\|\s*")
DATE_RANGE_RE = re.compile(
    r"\b(19|20)\d{2}\b.*\b(present|current|(?:19|20)\d{2})\b",
    re.IGNORECASE,
)
DEGREE_RE = re.compile(
    r"\b(bachelor|master|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|ph\.?d|diploma|degree|university|college)\b",
    re.IGNORECASE,
)

# FIX: `*` instead of `+` so a single standalone label line (e.g. just
# "Address:") matches too — not only combined lines like
# "Address: Phone: Email:". Trailing `:` is mandatory (no longer optional)
# so a bare word without a colon isn't accidentally treated as a label line.
LABEL_ONLY_LINE_RE = re.compile(
    r"^(?:address|phone|email|linkedin|github|tel|mobile)"
    r"(?:\s*:\s*(?:address|phone|email|linkedin|github|tel|mobile))*\s*:\s*$",
    re.IGNORECASE,
)
CONTACT_FIELD_RE = re.compile(r"\b(phone|email|tel|mobile|linkedin|github)\s*:", re.IGNORECASE)


def preprocess_extraction_artifacts(text: str) -> str:
    """Remove PDF/DOCX junk labels and expand inline contact rows."""
    cleaned_lines: list[str] = []
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped:
            cleaned_lines.append("")
            continue
        if LABEL_ONLY_LINE_RE.match(stripped):
            continue
        if "|" in stripped and (CONTACT_FIELD_RE.search(stripped) or "@" in stripped):
            cells = [cell.strip() for cell in TABLE_PIPE_RE.split(stripped) if cell.strip()]
            if len(cells) >= 2:
                cleaned_lines.extend(cells)
                continue
        cleaned_lines.append(stripped)
    return "\n".join(cleaned_lines)


def _format_experience_lines(lines: list[str]) -> list[str]:
    """Split long run-on experience paragraphs into readable bullet lines.

    Any content line that is not already bulleted, and is not a job
    title/company/date header line, gets an explicit bullet marker added
    so the frontend can render it as a list item instead of a flat
    paragraph.
    """
    formatted: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if stripped.startswith(("-", "•", "*")):
            formatted.append(stripped)
            continue
        if DATE_RANGE_RE.search(stripped) or "|" in stripped:
            # Job title / company / date header line — no bullet.
            formatted.append(stripped)
            continue
        if len(stripped) > 160 and ". " in stripped:
            parts = re.split(r"(?<=\.)\s+(?=[A-Z])", stripped)
            formatted.extend(f"• {part.strip()}" for part in parts if part.strip())
            continue
        # Regular description/achievement line — add a bullet.
        formatted.append(f"• {stripped}")
    return formatted


def expand_table_rows(text: str) -> str:
    """Convert inline table rows (pipe-separated cells) into one value per line."""
    expanded: list[str] = []
    for line in text.split("\n"):
        stripped = line.strip()
        if not stripped:
            expanded.append("")
            continue
        if "|" in stripped:
            cells = [cell.strip() for cell in TABLE_PIPE_RE.split(stripped) if cell.strip()]
            if len(cells) >= 2:
                expanded.extend(cells)
                continue
        expanded.append(stripped)
    return "\n".join(expanded)


def _dedupe_preserve_order(lines: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for line in lines:
        key = line.strip().lower()
        if not key or key in seen:
            continue
        seen.add(key)
        result.append(line.strip())
    return result


def _section_body_lines(section_payload: dict[str, Any] | None) -> list[str]:
    if not section_payload:
        return []
    paragraphs = section_payload.get("paragraphs") or []
    if paragraphs:
        lines: list[str] = []
        for paragraph in paragraphs:
            lines.extend(line.strip() for line in str(paragraph).split("\n") if line.strip())
        return lines
    text = str(section_payload.get("text") or "").strip()
    if not text:
        return []
    return [line.strip() for line in text.split("\n") if line.strip()]


def _render_contact_block(contact: dict[str, Any] | None) -> list[str]:
    contact = contact or {}
    lines: list[str] = []
    name = str(contact.get("name") or "").strip()
    headline = str(contact.get("headline") or "").strip()
    contact_lines = [str(line).strip() for line in contact.get("lines") or [] if str(line).strip()]
    if name:
        lines.append(name)
    if headline and headline.lower() != name.lower():
        lines.append(headline)
    for line in contact_lines:
        if line.lower() not in {item.lower() for item in lines}:
            lines.append(line)
    return lines


def _render_skills_lines(section_payload: dict[str, Any] | None) -> list[str]:
    if not section_payload:
        return []
    items = [str(item).strip() for item in section_payload.get("items") or [] if str(item).strip()]
    if items:
        return [", ".join(items)]
    return _section_body_lines(section_payload)


def _split_unassigned_blocks(unassigned_text: str) -> dict[str, list[str]]:
    """Heuristically bucket orphan text when headings were parsed out of order."""
    blocks: dict[str, list[str]] = {
        "summary": [],
        "experience": [],
        "education": [],
        "skills": [],
        "other": [],
    }
    current = "summary"
    for line in unassigned_text.split("\n"):
        stripped = line.strip()
        if not stripped:
            continue
        lowered = stripped.lower()
        if DEGREE_RE.search(stripped):
            current = "education"
        elif DATE_RANGE_RE.search(stripped) or re.search(r"\b(present|current)\b", lowered):
            current = "experience"
        elif stripped.startswith(("-", "•", "*")):
            current = "experience"
        elif (
            "," in stripped
            and len(stripped) < 180
            and not DATE_RANGE_RE.search(stripped)
            and not DEGREE_RE.search(stripped)
            and stripped.count(",") >= 2
            and not re.search(r"\b(university|college|institute|school)\b", lowered)
        ):
            current = "skills"
        elif (
            len(stripped) < 100
            and re.search(
                r"\b(specialist|manager|engineer|developer|analyst|coordinator|inspector)\b",
                lowered,
            )
            and ("|" in stripped or DATE_RANGE_RE.search(stripped))
        ):
            current = "experience"
        blocks[current].append(stripped)
    return blocks


def _redistribute_misplaced_content(section_bodies: dict[str, list[str]]) -> dict[str, list[str]]:
    """
    When headings were extracted out of order, content often lands entirely in summary.
    Split mixed summary blocks into canonical sections when dedicated sections are empty.
    """
    summary_lines = section_bodies.get("summary", [])
    if len(summary_lines) < 3:
        return section_bodies
    has_dedicated_content = any(section_bodies.get(key) for key in ("experience", "education", "skills"))
    if has_dedicated_content:
        return section_bodies
    buckets = _split_unassigned_blocks("\n".join(summary_lines))
    section_bodies["summary"] = buckets["summary"]
    section_bodies["experience"] = _merge_section_lines(section_bodies["experience"], buckets["experience"])
    section_bodies["education"] = _merge_section_lines(section_bodies["education"], buckets["education"])
    section_bodies["skills"] = _merge_section_lines(section_bodies["skills"], buckets["skills"])
    section_bodies["experience"] = _merge_section_lines(section_bodies["experience"], buckets["other"])
    return section_bodies


def _merge_section_lines(existing: list[str], extra: list[str]) -> list[str]:
    if not extra:
        return existing
    if not existing:
        return extra
    return _dedupe_preserve_order([*existing, *extra])


def normalize_to_ats(structured_sections: dict[str, Any] | None) -> str:
    sections = structured_sections or {}
    output_lines: list[str] = []

    contact_lines = _render_contact_block(sections.get("contact"))
    if contact_lines:
        output_lines.extend(contact_lines)
        output_lines.append("")

    section_bodies: dict[str, list[str]] = {
        key: _section_body_lines(sections.get(key)) for key, _ in CANONICAL_SECTIONS
    }
    section_bodies["skills"] = _render_skills_lines(sections.get("skills"))

    unassigned_text = str(sections.get("unassigned", {}).get("text") or "").strip()
    if unassigned_text:
        buckets = _split_unassigned_blocks(unassigned_text)
        section_bodies["summary"] = _merge_section_lines(section_bodies["summary"], buckets["summary"])
        section_bodies["experience"] = _merge_section_lines(section_bodies["experience"], buckets["experience"])
        section_bodies["education"] = _merge_section_lines(section_bodies["education"], buckets["education"])
        section_bodies["skills"] = _merge_section_lines(section_bodies["skills"], buckets["skills"])
        if buckets["other"]:
            section_bodies["experience"] = _merge_section_lines(section_bodies["experience"], buckets["other"])

    section_bodies = _redistribute_misplaced_content(section_bodies)

    if section_bodies.get("experience"):
        section_bodies["experience"] = _format_experience_lines(section_bodies["experience"])

    for section_key, default_heading in CANONICAL_SECTIONS:
        body_lines = [line for line in section_bodies.get(section_key, []) if line.strip()]
        if not body_lines:
            continue
        output_lines.append(default_heading)
        output_lines.extend(body_lines)
        output_lines.append("")

    for extra in sections.get("additional_sections") or []:
        body_lines = _section_body_lines(extra)
        if not body_lines:
            continue
        section_type = str(extra.get("type") or "").strip().lower()
        heading = str(extra.get("heading") or "").strip().upper()
        if not heading:
            heading = ADDITIONAL_SECTION_HEADINGS.get(section_type, section_type.upper() or "ADDITIONAL")
        output_lines.append(heading)
        output_lines.extend(body_lines)
        output_lines.append("")

    while output_lines and not output_lines[-1].strip():
        output_lines.pop()

    return "\n".join(output_lines)


def normalize_resume_extraction(
    raw_text: str,
    structured_sections: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """
    Normalize extracted resume content to ATS-friendly linear text.
    Returns normalized text, structured sections, and line map derived from the
    normalized output (single source of truth for downstream rendering).
    """
    preprocessed = preprocess_extraction_artifacts(expand_table_rows(raw_text or ""))
    parsed = parse_structured_sections(preprocessed)
    sections = structured_sections or parsed["structured_sections"]
    normalized_text = normalize_to_ats(sections)
    if not normalized_text.strip():
        normalized_text = preprocessed.strip()
    normalized_parsed = parse_structured_sections(normalized_text)
    changed = normalized_text.strip() != preprocessed.strip()
    return {
        "raw_text": preprocessed,
        "normalized_text": normalized_text,
        "structured_sections": normalized_parsed["structured_sections"],
        "lines": normalized_parsed["lines"],
        "normalization": {
            "method": "rule-based",
            "applied": True,
            "changed": changed,
        },
    }
    
```

### FILE: `python-service/resume_extractor.py`

```python
import io
import re
from typing import Any

from cleaner import clean_text
from extractor import extract_pdf

SECTION_HEADER_SPECS: list[dict[str, Any]] = [
    {
        "type": "summary",
        "keys": [
            "professional summary",
            "career summary",
            "executive summary",
            "about me",
            "summary",
            "profile",
            "objective",
        ],
    },
    {
        "type": "experience",
        "keys": [
            "professional experience",
            "work experience",
            "employment history",
            "career history",
            "work history",
            "employment",
            "internships",
            "internship experience",
            "technical experience",
            "relevant experience",
            "experience",
        ],
    },
    {
        "type": "education",
        "keys": [
            "academic background",
            "academic qualifications",
            "education",
            "academic",
            "qualifications",
        ],
    },
    {
        "type": "skills",
        "keys": [
            "areas of expertise",
            "core competencies",
            "technical skills",
            "key skills",
            "skills",
            "expertise",
            "competencies",
        ],
    },
    {
        "type": "languages",
        "keys": ["language proficiency", "languages", "language"],
    },
    {
        "type": "certifications",
        "keys": ["certifications and courses", "courses", "training", "certifications", "certificates", "licenses"],
    },
    {
        "type": "projects",
        "keys": [
            "personal projects",
            "technical projects",
            "academic projects",
            "key projects",
            "projects",
        ],
    },
    {
        "type": "awards",
        "keys": ["achievements", "honors", "honours", "awards"],
    },
    {
        "type": "volunteer",
        "keys": ["volunteer experience", "volunteering", "memberships", "organisations", "organizations"],
    },
    {
        "type": "interests",
        "keys": ["interests", "hobbies"],
    },
    {
        "type": "references",
        "keys": ["references"],
    },
]

EXACT_ONLY_HEADER_KEYS = {
    "profile",
    "experience",
    "competencies",
    "expertise",
    "skills",
    "education",
    "employment",
    "objective",
    "training",
    "courses",
    "projects",
    "languages",
    "language",
    "interests",
    "references",
    "awards",
    "academic",
    "qualifications",
    "internships",
    "certificates",
    "certifications",
    "licenses",
    "hobbies",
    "summary",
}

EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
PHONE_RE = re.compile(
    r"(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}(?:\s*(?:ext\.?|x)\s*\d+)?",
    re.IGNORECASE,
)
URL_RE = re.compile(
    r"(?:https?://)?(?:www\.)?(?:linkedin\.com/\S+|github\.com/\S+)",
    re.IGNORECASE,
)

ALLOWED_RESUME_EXTENSIONS = {".pdf", ".docx"}
ALLOWED_RESUME_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


def _normalize_heading(line: str) -> str:
    return re.sub(r"[^a-z0-9\s]", "", line.strip().lower()).strip()


def detect_section_type(line: str) -> str | None:
    normalized = _normalize_heading(line)
    if not normalized:
        return None

    for spec in SECTION_HEADER_SPECS:
        for key in sorted(spec["keys"], key=len, reverse=True):
            if key in EXACT_ONLY_HEADER_KEYS:
                if normalized == key:
                    return spec["type"]
            elif normalized == key or normalized.startswith(f"{key} "):
                return spec["type"]

    return None


def _looks_like_contact_line(line: str) -> bool:
    stripped = line.strip()
    if not stripped:
        return False
    if EMAIL_RE.search(stripped):
        return True
    if URL_RE.search(stripped):
        return True
    if PHONE_RE.search(stripped) and sum(char.isdigit() for char in stripped) >= 7:
        return True
    return False


def _split_skills_items(text: str) -> list[str]:
    if not text.strip():
        return []

    parts = re.split(r"[,|\n•]+", text)
    items = [part.strip() for part in parts if part.strip()]

    if len(items) == 1:
        items = [
            token.strip()
            for token in re.split(r"\s{2,}|\s+and\s+|(?<=[a-z])\s+(?=[A-Z])", text)
            if token.strip() and 1 < len(token.strip()) < 120
        ]

    return items


def _build_line_map(text: str) -> list[dict[str, Any]]:
    lines: list[dict[str, Any]] = []
    offset = 0

    for index, line in enumerate(text.split("\n")):
        lines.append(
            {
                "line_number": index + 1,
                "text": line,
                "char_start": offset,
                "char_end": offset + len(line),
                "section_type": None,
            }
        )
        offset += len(line) + 1

    return lines


def parse_structured_sections(full_text: str) -> dict[str, Any]:
    text = clean_text(full_text)
    raw_lines = text.split("\n")
    line_map = _build_line_map(text)

    sections: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    contact_lines: list[str] = []
    header_lines: list[str] = []
    first_section_index: int | None = None

    for index, line in enumerate(raw_lines):
        section_type = detect_section_type(line)

        if section_type:
            if first_section_index is None:
                first_section_index = index
            if current:
                sections.append(current)
            current = {"type": section_type, "heading": line.strip(), "lines": []}
            if index < len(line_map):
                line_map[index]["section_type"] = section_type
            continue

        if current:
            current["lines"].append(line)
            if index < len(line_map):
                line_map[index]["section_type"] = current["type"]
        elif first_section_index is None:
            if _looks_like_contact_line(line):
                contact_lines.append(line)
                if index < len(line_map):
                    line_map[index]["section_type"] = "contact"
            else:
                header_lines.append(line)

    if current:
        sections.append(current)

    if first_section_index is None:
        contact_lines = [line for line in raw_lines if _looks_like_contact_line(line)]
        header_lines = [line for line in raw_lines if line not in contact_lines]

    structured: dict[str, Any] = {
        "contact": {
            "name": header_lines[0].strip() if header_lines else "",
            "headline": header_lines[1].strip() if len(header_lines) > 1 else "",
            "lines": contact_lines,
            "text": "\n".join(contact_lines).strip(),
        },
        "summary": {"text": "", "paragraphs": []},
        "experience": {"text": "", "paragraphs": []},
        "education": {"text": "", "paragraphs": []},
        "skills": {"text": "", "items": []},
        "additional_sections": [],
        "unassigned": {"text": ""},
    }

    for section in sections:
        body = "\n".join(section["lines"]).strip()
        paragraphs = [paragraph.strip() for paragraph in re.split(r"\n\s*\n", body) if paragraph.strip()]
        payload = {
            "heading": section["heading"],
            "text": body,
            "paragraphs": paragraphs or ([body] if body else []),
        }

        section_type = section["type"]
        if section_type == "summary":
            structured["summary"] = payload
        elif section_type == "experience":
            structured["experience"] = payload
        elif section_type == "education":
            structured["education"] = payload
        elif section_type == "skills":
            structured["skills"] = {
                **payload,
                "items": _split_skills_items(body),
            }
        else:
            structured["additional_sections"].append({"type": section_type, **payload})

    if first_section_index is None and header_lines:
        structured["unassigned"]["text"] = "\n".join(header_lines[2:] + raw_lines).strip()

    return {
        "structured_sections": structured,
        "lines": line_map,
    }


def extract_docx(docx_bytes: bytes) -> dict[str, Any]:
    try:
        import docx
    except ImportError as exc:
        raise RuntimeError("python-docx is required for DOCX extraction.") from exc

    document = docx.Document(io.BytesIO(docx_bytes))
    paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs if paragraph.text.strip()]

    table_lines: list[str] = []
    for table in document.tables:
        for row in table.rows:
            cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
            if cells:
                table_lines.append(" | ".join(cells))

    combined = "\n".join(paragraphs + table_lines)
    full_text = clean_text(combined)

    return {
        "pages": 1,
        "page_texts": [{"text": full_text, "page": 1, "source": "docx"}],
        "full_text": full_text,
        "metadata": {
            "title": document.core_properties.title or "",
            "author": document.core_properties.author or "",
            "pages": 1,
            "has_text_layer": True,
            "extraction_mode": "docx",
            "paragraph_count": len(paragraphs),
            "table_row_count": len(table_lines),
        },
    }


def extract_resume_bytes(file_bytes: bytes, filename: str) -> dict[str, Any]:
    if not file_bytes:
        raise ValueError("Uploaded file is empty.")

    extension = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ALLOWED_RESUME_EXTENSIONS:
        raise ValueError("Only PDF and DOCX files are supported.")

    if extension == ".pdf":
        if not file_bytes.startswith(b"%PDF"):
            raise ValueError("File is not a valid PDF.")
        extraction = extract_pdf(file_bytes)
    else:
        extraction = extract_docx(file_bytes)

    full_text = extraction.get("full_text", "")
    cleaned_text = clean_text(full_text)
    from ats_normalizer import normalize_resume_extraction

    normalized = normalize_resume_extraction(cleaned_text)

    return {
        "success": True,
        "filename": filename,
        "file_type": extension.lstrip("."),
        "raw_text": normalized["raw_text"],
        "full_text": normalized["normalized_text"],
        "structured_sections": normalized["structured_sections"],
        "lines": normalized["lines"],
        "normalization": normalized["normalization"],
        "pages": extraction.get("pages", 0),
        "page_texts": extraction.get("page_texts", []),
        "metadata": {
            **(extraction.get("metadata") or {}),
            "ats_normalized": normalized["normalization"]["applied"],
            "normalization_method": normalized["normalization"]["method"],
            "normalization_changed": normalized["normalization"]["changed"],
        },
    }

```

### FILE: `python-service/cleaner.py`

```python
import re


def _normalize_for_compare(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip().lower())


def dedupe_lines(text: str) -> str:
    lines = text.split("\n")
    result: list[str] = []
    prev_norm = None
    for line in lines:
        norm = _normalize_for_compare(line)
        if not norm:
            result.append("")
            prev_norm = None
            continue
        if norm == prev_norm:
            continue
        result.append(line.strip())
        prev_norm = norm
    return "\n".join(result)


def dedupe_paragraphs(text: str) -> str:
    paragraphs = re.split(r"\n\s*\n", text)
    seen: set[str] = set()
    kept: list[str] = []
    for paragraph in paragraphs:
        stripped = paragraph.strip()
        if not stripped:
            continue
        norm = _normalize_for_compare(stripped)
        if len(norm) < 24:
            kept.append(stripped)
            continue
        if norm in seen:
            continue
        if any(norm in previous for previous in seen if len(previous) > len(norm) + 20):
            continue
        seen.add(norm)
        kept.append(stripped)
    return "\n\n".join(kept)


def remove_substring_lines(text: str) -> str:
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    if len(lines) < 2:
        return text
    kept: list[str] = []
    normalized = [_normalize_for_compare(line) for line in lines]
    for index, line in enumerate(lines):
        norm = normalized[index]
        # Short lines are often skills, dates, or titles — always keep them.
        if len(norm) < 80:
            kept.append(line)
            continue
        # Only remove exact duplicate lines, not substring matches.
        is_exact_duplicate = any(
            norm == other_norm
            for other_index, other_norm in enumerate(normalized)
            if index != other_index
        )
        if not is_exact_duplicate:
            kept.append(line)
    return "\n".join(kept)


def clean_text(text: str) -> str:
    if not text:
        return ""
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n")
    # Fix broken hyphenated words: hy-\nphen -> hyphen
    cleaned = re.sub(r"(\w)-\n(\w)", r"\1\2", cleaned)
    lines: list[str] = []
    for line in cleaned.split("\n"):
        line = re.sub(r"[ \t]+", " ", line.strip())
        if not line:
            lines.append("")
            continue
        if re.fullmatch(r"\d{1,4}", line):
            continue
        # FIX: `*` instead of `+` so a single standalone label (e.g. just
        # "Address:") also matches, not only combined lines like
        # "Address: Phone: Email:". Trailing `:` is now mandatory so a bare
        # word like "Email" (no colon) in normal body text isn't stripped.
        if re.fullmatch(
            r"(?:address|phone|email|linkedin|github|tel|mobile)"
            r"(?:\s*:\s*(?:address|phone|email|linkedin|github|tel|mobile))*\s*:",
            line,
            flags=re.IGNORECASE,
        ):
            continue
        lines.append(line)
    cleaned = "\n".join(lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned)
    cleaned = dedupe_lines(cleaned)
    cleaned = remove_substring_lines(cleaned)
    cleaned = dedupe_paragraphs(cleaned)
    return cleaned.strip()

```

### FILE: `python-service/chunker.py`

```python
import re
from typing import Any


def count_tokens(text: str) -> int:
    """Approximate token count using whitespace-delimited words."""
    if not text:
        return 0
    return len(re.findall(r"\S+", text))


def chunk_text(
    full_text: str,
    page_texts: list[dict[str, Any]] | None = None,
    chunk_size: int = 800,
    overlap: int = 100,
) -> list[dict[str, Any]]:
    if not full_text.strip():
        return []

    words = re.findall(r"\S+", full_text)
    if not words:
        return []

    # Map character offsets to page numbers when available
    page_offsets: list[tuple[int, int, int]] = []
    if page_texts:
        offset = 0
        for item in page_texts:
            page_num = int(item.get("page", 1))
            page_text = item.get("text", "")
            start = offset
            end = offset + len(page_text)
            page_offsets.append((start, end, page_num))
            offset = end + 2  # account for page joiner "\n\n"

    def page_for_offset(char_offset: int) -> int:
        for start, end, page_num in page_offsets:
            if start <= char_offset < end:
                return page_num
        return page_offsets[-1][2] if page_offsets else 1

    chunks: list[dict[str, Any]] = []
    step = max(1, chunk_size - overlap)
    index = 0

    while index < len(words):
        slice_words = words[index : index + chunk_size]
        text = " ".join(slice_words)

        char_offset = len(" ".join(words[:index]))
        page = page_for_offset(char_offset)

        chunks.append(
            {
                "text": text,
                "page": page,
                "metadata": {
                    "chunk_index": len(chunks),
                    "token_estimate": count_tokens(text),
                    "word_start": index,
                    "word_end": index + len(slice_words),
                },
            }
        )

        if index + chunk_size >= len(words):
            break
        index += step

    return chunks

```

### FILE: `python-service/platform_config.py`

```python
import glob
import os
import platform
import shutil

import pytesseract

POPPLER_BIN: str | None = None


def _first_existing(paths: list[str]) -> str | None:
    for path in paths:
        if path and os.path.exists(path):
            return path
    return None


def _discover_poppler_bin() -> str | None:
    discovered = shutil.which("pdffonts")
    if discovered:
        return os.path.dirname(discovered)

    if platform.system() != "Windows":
        return None

    winget_pattern = os.path.join(
        os.environ.get("LOCALAPPDATA", ""),
        "Microsoft",
        "WinGet",
        "Packages",
        "oschwartz10612.Poppler_*",
        "poppler-*",
        "Library",
        "bin",
    )
    matches = glob.glob(winget_pattern)
    if matches:
        return sorted(matches)[-1]

    return _first_existing(
        [
            r"C:\poppler\Library\bin",
            r"C:\Program Files\poppler\Library\bin",
        ]
    )


def configure_platform_tools() -> None:
    global POPPLER_BIN

    if platform.system() == "Windows":
        tesseract_cmd = _first_existing(
            [
                shutil.which("tesseract") or "",
                r"C:\Program Files\Tesseract-OCR\tesseract.exe",
                r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
            ]
        )
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd

    POPPLER_BIN = _discover_poppler_bin()

    if POPPLER_BIN:
        poppler_path = os.environ.get("PATH", "")
        if POPPLER_BIN not in poppler_path:
            os.environ["PATH"] = f"{POPPLER_BIN};{poppler_path}"


configure_platform_tools()

```

### FILE: `python-service/requirements.txt`

```text
fastapi>=0.110,<1.0
uvicorn[standard]>=0.27,<1.0
python-multipart>=0.0.9,<1.0
python-dotenv>=1.0,<2.0
pymupdf>=1.23,<2.0
pdfplumber>=0.11,<1.0
pytesseract>=0.3.10,<1.0
pdf2image>=1.17,<2.0
python-docx>=1.1,<2.0

```

### FILE: `python-service/.env.example`

```text
# Copy to .env and keep in sync with backend PYTHON_SERVICE_API_KEY
PYTHON_SERVICE_API_KEY=change_me_shared_secret_between_node_and_python
PYTHON_SERVICE_MAX_UPLOAD_BYTES=10485760
PYTHON_SERVICE_MAX_PAGES=50
PYTHON_SERVICE_CORS_ORIGINS=http://localhost:5000

```

