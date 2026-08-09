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

  // Navigate on status alone — optional analysis prefetch only warms cache / skill chips.
  useEffect(() => {
    if (!overlayOpen || statusData?.status !== 'completed') return;

    const timer = setTimeout(() => {
      setOverlayOpen(false);
      navigate(`/resume-scanner/${activeAnalysisId}`);
      setActiveAnalysisId(null);
    }, 2000);

    return () => clearTimeout(timer);
  }, [overlayOpen, statusData?.status, activeAnalysisId, navigate]);

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
            {t('upload.progressReady', { progress: progressPct })}
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
