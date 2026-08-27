/**
 * Resume Scanner analysis workspace — approved workflow:
 * Rewrite Gate → Improve → Finalize → Done
 * (Setup / Processing live on the upload page.)
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';
import ResumeEditor from '../../features/resumeScanner/components/ResumeEditor';
import ScannerSectionEditor from '../../features/resumeScanner/components/ScannerSectionEditor';
import SkillsSidebar from '../../features/resumeScanner/components/SkillsSidebar';
import SuggestionToolbar from '../../features/resumeScanner/components/SuggestionToolbar';
import RewriteComparisonPanel from '../../features/resumeScanner/components/RewriteComparisonPanel';
import WorkflowPhaseRail from '../../features/resumeScanner/components/WorkflowPhaseRail';
import DonePanel from '../../features/resumeScanner/components/DonePanel';
import ResumePreview from '../../features/resumeBuilder/components/ResumePreview';
import { DEFAULT_TEMPLATE } from '../../features/resumeBuilder/components/templatesConfig';
import {
  useAcceptAllSuggestions,
  useDownloadResumeScannerPdf,
  useFinalizeResumeScanner,
  useRedoResumeScannerChange,
  useResumeScannerAnalysis,
  useUndoResumeScannerChange,
  useUpdateResumeScannerText,
  useUpdateRewriteStatus,
  useUpdateSuggestionStatus,
} from '../../features/resumeScanner/hooks/useResumeScanner';
import { resolveApiError } from '../../utils/apiError';
import { cn } from '../../lib/utils';
import Skeleton from '../../components/Skeleton';
import {
  hasParsedData,
  normalizeParsedData,
  structuredResumeToParsedData,
} from '../../features/resumeScanner/utils/structuredResumeBuilderUtils';
import {
  WORKFLOW_PHASES,
  canShowDownloadPdf,
  getPhaseActions,
  isRewriteGatePending,
  resolveInitialAnalysisPhase,
} from '../../features/resumeScanner/utils/workflowPhases';

const WORKSPACE_TABS = ['resume', 'jobDescription'];

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
  const rewriteMutation = useUpdateRewriteStatus(analysisId);
  const finalizeMutation = useFinalizeResumeScanner(analysisId);
  const downloadPdfMutation = useDownloadResumeScannerPdf(analysisId);

  const editorRef = useRef(null);
  const prevScoresRef = useRef({ ats: null, job: null });
  const scoresInitializedRef = useRef(false);
  const phaseInitializedRef = useRef(false);
  const [scoreDeltas, setScoreDeltas] = useState({ ats: 0, job: 0 });
  const [isSavingText, setIsSavingText] = useState(false);
  const [workflowPhase, setWorkflowPhase] = useState(WORKFLOW_PHASES.IMPROVE);
  const [workspaceTab, setWorkspaceTab] = useState('resume');
  const [viewMode, setViewMode] = useState('edit');

  useEffect(() => {
    if (!analysis || phaseInitializedRef.current) return;
    phaseInitializedRef.current = true;
    setWorkflowPhase(resolveInitialAnalysisPhase(analysis));
  }, [analysis]);

  // If server still requires rewrite review, force gate (e.g. after refresh)
  useEffect(() => {
    if (!analysis) return;
    if (isRewriteGatePending(analysis) && workflowPhase !== WORKFLOW_PHASES.REWRITE_GATE) {
      setWorkflowPhase(WORKFLOW_PHASES.REWRITE_GATE);
      setWorkspaceTab('resume');
    }
  }, [analysis, workflowPhase]);

  const recordScoreDeltas = useCallback((before, afterAnalysis) => {
    if (!afterAnalysis) return;
    const nextAts = Number(afterAnalysis.atsScore) || 0;
    const nextJob =
      afterAnalysis.jobMatchScore == null || afterAnalysis.jobMatchUnavailable
        ? null
        : Number(afterAnalysis.jobMatchScore) || 0;
    const beforeAts = Number(before?.atsScore) || 0;
    const beforeJob =
      before?.jobMatchScore == null || before?.jobMatchUnavailable
        ? null
        : Number(before.jobMatchScore) || 0;

    setScoreDeltas({
      ats: nextAts - beforeAts,
      job: nextJob != null && beforeJob != null ? nextJob - beforeJob : 0,
    });
    prevScoresRef.current = { ats: nextAts, job: nextJob };
  }, []);

  useEffect(() => {
    if (!analysis || scoresInitializedRef.current) return;
    scoresInitializedRef.current = true;
    prevScoresRef.current = {
      ats: Number(analysis.atsScore) || 0,
      job:
        analysis.jobMatchScore == null || analysis.jobMatchUnavailable
          ? null
          : Number(analysis.jobMatchScore) || 0,
    };
    setScoreDeltas({ ats: 0, job: 0 });
  }, [analysis]);

  const handleSuggestionAction = useCallback(
    async (suggestion, action) => {
      const before = analysis;
      try {
        const response = await suggestionMutation.mutateAsync({
          suggestionId: suggestion.id,
          action,
        });
        recordScoreDeltas(before, response?.analysis);
      } catch (mutationError) {
        toast.error(resolveApiError(mutationError, t('analysis.errors.suggestionFailed')));
      }
    },
    [analysis, suggestionMutation, recordScoreDeltas, t]
  );

  const handleStructuredChange = useCallback(
    async (structuredResume) => {
      const before = analysis;
      setIsSavingText(true);
      try {
        const response = await textMutation.mutateAsync({ structuredResume });
        recordScoreDeltas(before, response?.analysis);
      } catch (mutationError) {
        toast.error(resolveApiError(mutationError, t('analysis.errors.textFailed')));
      } finally {
        setIsSavingText(false);
      }
    },
    [analysis, textMutation, recordScoreDeltas, t]
  );

  const handleParsedDataChange = useCallback(
    async (parsedData, templateId) => {
      const before = analysis;
      setIsSavingText(true);
      try {
        const response = await textMutation.mutateAsync({ parsedData, templateId });
        recordScoreDeltas(before, response?.analysis);
      } catch (mutationError) {
        toast.error(resolveApiError(mutationError, t('analysis.errors.textFailed')));
      } finally {
        setIsSavingText(false);
      }
    },
    [analysis, textMutation, recordScoreDeltas, t]
  );

  const flushEditor = useCallback(async () => {
    const pending = editorRef.current?.flushPendingSave?.();
    if (pending) {
      await handleStructuredChange(pending);
    }
  }, [handleStructuredChange]);

  const handleSwitchToPreview = useCallback(async () => {
    if (viewMode === 'preview') return;
    await flushEditor();
    setViewMode('preview');
  }, [viewMode, flushEditor]);

  const handleContinueToFinalize = useCallback(async () => {
    await flushEditor();
    setWorkflowPhase(WORKFLOW_PHASES.FINALIZE);
    setViewMode('edit');
    setWorkspaceTab('resume');
  }, [flushEditor]);

  const handleBackToImprove = useCallback(() => {
    setWorkflowPhase(WORKFLOW_PHASES.IMPROVE);
    setWorkspaceTab('resume');
  }, []);

  const handleFinish = useCallback(async () => {
    try {
      await finalizeMutation.mutateAsync();
      setWorkflowPhase(WORKFLOW_PHASES.DONE);
      setWorkspaceTab('resume');
      toast.success(t('analysis.done.toasts.finished'));
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.errors.finalizeFailed')));
    }
  }, [finalizeMutation, t]);

  const handleDownloadPdf = useCallback(async () => {
    try {
      const { blob, filename } = await downloadPdfMutation.mutateAsync();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success(t('analysis.toasts.pdfDownloaded'));
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.errors.pdfFailed')));
    }
  }, [downloadPdfMutation, t]);

  const handleBackToFinalize = useCallback(() => {
    setWorkflowPhase(WORKFLOW_PHASES.FINALIZE);
  }, []);

  const previewParsedData = analysis
    ? hasParsedData(analysis.parsedData)
      ? normalizeParsedData(analysis.parsedData)
      : structuredResumeToParsedData(analysis.structuredResume, analysis.parsedData)
    : null;

  const previewTemplateId = analysis?.templateId || DEFAULT_TEMPLATE;

  const handleAcceptAll = useCallback(async () => {
    const before = analysis;
    try {
      // Do not flush stale drafts — cancel so they cannot overwrite accept-all scores.
      editorRef.current?.cancelPendingSave?.();
      const response = await acceptAllMutation.mutateAsync();
      recordScoreDeltas(before, response?.analysis);
      toast.success(t('analysis.toasts.acceptAllSuccess'));
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.errors.acceptAllFailed')));
    }
  }, [analysis, acceptAllMutation, recordScoreDeltas, t]);

  const handleUndo = useCallback(async () => {
    const before = analysis;
    try {
      const response = await undoMutation.mutateAsync();
      recordScoreDeltas(before, response?.analysis);
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.errors.undoFailed')));
    }
  }, [analysis, undoMutation, recordScoreDeltas, t]);

  const handleRedo = useCallback(async () => {
    const before = analysis;
    try {
      const response = await redoMutation.mutateAsync();
      recordScoreDeltas(before, response?.analysis);
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.errors.redoFailed')));
    }
  }, [analysis, redoMutation, recordScoreDeltas, t]);

  const isSaving = isSavingText || textMutation.isPending;
  const isSuggestionBusy = suggestionMutation.isPending || acceptAllMutation.isPending;
  const phaseActions = getPhaseActions(workflowPhase);
  const showRewriteGate =
    workflowPhase === WORKFLOW_PHASES.REWRITE_GATE || isRewriteGatePending(analysis);
  const showDownloadPdf = canShowDownloadPdf(workflowPhase, analysis);

  const handleAcceptRewrite = useCallback(async () => {
    const before = analysis;
    try {
      const response = await rewriteMutation.mutateAsync('accept');
      recordScoreDeltas(before, response?.analysis);
      toast.success(t('analysis.rewrite.toasts.accepted'));
      setWorkflowPhase(WORKFLOW_PHASES.IMPROVE);
      setWorkspaceTab('resume');
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.rewrite.errors.acceptFailed')));
    }
  }, [analysis, rewriteMutation, recordScoreDeltas, t]);

  const handleRejectRewrite = useCallback(async () => {
    const before = analysis;
    try {
      const response = await rewriteMutation.mutateAsync('reject');
      recordScoreDeltas(before, response?.analysis);
      toast.success(t('analysis.rewrite.toasts.rejected'));
      setWorkflowPhase(WORKFLOW_PHASES.IMPROVE);
      setWorkspaceTab('resume');
    } catch (mutationError) {
      toast.error(resolveApiError(mutationError, t('analysis.rewrite.errors.rejectFailed')));
    }
  }, [analysis, rewriteMutation, recordScoreDeltas, t]);

  return (
    <DashboardLayout user={user}>
      {isLoading ? (
        <div className="flex flex-col lg:flex-row gap-4 min-h-[calc(100dvh-7rem)]">
          <div className="w-full lg:w-[350px] shrink-0 space-y-4 rounded-xl border border-outline-variant/40 bg-white p-4">
            <Skeleton
              type="card"
              count={1}
              withMedia={false}
              lines={2}
              label={t('analysis.loading')}
            />
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
            <SkillsSidebar analysis={analysis} scoreDeltas={scoreDeltas} />
          </div>

          <section className="flex-1 flex flex-col overflow-hidden bg-surface-container-low min-w-0">
            <div className="px-6 lg:px-8 pt-3 pb-2 flex flex-col gap-3 bg-white border-b border-slate-200 shrink-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <WorkflowPhaseRail
                  currentPhase={
                    showRewriteGate ? WORKFLOW_PHASES.REWRITE_GATE : workflowPhase
                  }
                  includeRewriteGate={
                    showRewriteGate ||
                    ['accepted', 'rejected', 'pending_review'].includes(
                      analysis.rewriteStatus
                    )
                  }
                />
                <Link
                  to="/resume-scanner"
                  className="text-xs font-semibold text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                >
                  {t('analysis.toolbar.newAnalysis')}
                </Link>
              </div>

              {phaseActions.showWorkspaceTabs ? (
                <div className="flex gap-6 lg:gap-8 text-sm font-semibold">
                  {WORKSPACE_TABS.map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setWorkspaceTab(tab)}
                      className={cn(
                        'pb-2 transition-colors',
                        workspaceTab === tab
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-slate-400 hover:text-slate-600'
                      )}
                    >
                      {t(`analysis.workspaceTabs.${tab}`)}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {showRewriteGate ? (
              <RewriteComparisonPanel
                analysis={analysis}
                onAcceptRewrite={handleAcceptRewrite}
                onRejectRewrite={handleRejectRewrite}
                isAccepting={
                  rewriteMutation.isPending && rewriteMutation.variables === 'accept'
                }
                isRejecting={
                  rewriteMutation.isPending && rewriteMutation.variables === 'reject'
                }
              />
            ) : null}

            {!showRewriteGate && workflowPhase === WORKFLOW_PHASES.DONE ? (
              <DonePanel
                analysis={analysis}
                onBackToFinalize={handleBackToFinalize}
                onDownloadPdf={handleDownloadPdf}
                canDownloadPdf={showDownloadPdf}
                isDownloadingPdf={downloadPdfMutation.isPending}
              />
            ) : null}

            {!showRewriteGate &&
              workflowPhase !== WORKFLOW_PHASES.DONE &&
              workspaceTab === 'resume' ? (
              <>
                <SuggestionToolbar
                  suggestionStats={analysis.suggestionStats}
                  history={analysis.history}
                  phase={workflowPhase}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onAcceptAll={handleAcceptAll}
                  onContinueToFinalize={handleContinueToFinalize}
                  onBackToImprove={handleBackToImprove}
                  onFinish={handleFinish}
                  onDownloadPdf={handleDownloadPdf}
                  showDownloadPdf={showDownloadPdf}
                  isUndoing={undoMutation.isPending}
                  isRedoing={redoMutation.isPending}
                  isAcceptingAll={isSuggestionBusy}
                  isFinishing={finalizeMutation.isPending}
                  isDownloadingPdf={downloadPdfMutation.isPending}
                />

                {workflowPhase === WORKFLOW_PHASES.IMPROVE ? (
                  <>
                    <div className="px-6 lg:px-8 pt-3 flex items-center gap-2 bg-white border-b border-slate-200 shrink-0">
                      <button
                        type="button"
                        onClick={() => setViewMode('edit')}
                        className={cn(
                          'px-3 py-1 text-xs rounded-full transition-colors',
                          viewMode === 'edit'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        )}
                      >
                        {t('analysis.viewMode.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchToPreview}
                        disabled={!analysis.resumeText && !analysis.structuredSections}
                        className={cn(
                          'px-3 py-1 text-xs rounded-full transition-colors',
                          viewMode === 'preview'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600',
                          !analysis.resumeText &&
                          !analysis.structuredSections &&
                          'opacity-40 cursor-not-allowed'
                        )}
                      >
                        {t('analysis.viewMode.preview')}
                      </button>
                      {isSaving ? (
                        <span className="ml-2 text-xs text-slate-400">
                          {t('analysis.editor.saving')}
                        </span>
                      ) : null}
                    </div>

                    {viewMode === 'preview' ? (
                      <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex justify-center bg-slate-50 min-h-0">
                        <div className="w-full max-w-[800px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
                          <ResumePreview data={previewParsedData} templateId={previewTemplateId} />
                        </div>
                      </div>
                    ) : (
                      <ResumeEditor
                        ref={editorRef}
                        structuredResume={analysis.structuredResume}
                        suggestions={analysis.suggestions}
                        templateId={analysis.templateId || DEFAULT_TEMPLATE}
                        onStructuredChange={handleStructuredChange}
                        onSuggestionAction={handleSuggestionAction}
                        isSaving={isSaving}
                        isSuggestionLoading={isSuggestionBusy}
                        suggestionsEnabled
                      />
                    )}
                  </>
                ) : null}

                {workflowPhase === WORKFLOW_PHASES.FINALIZE ? (
                  <ScannerSectionEditor
                    parsedData={analysis.parsedData}
                    structuredResume={analysis.structuredResume}
                    templateId={analysis.templateId}
                    onParsedDataChange={handleParsedDataChange}
                    isSaving={isSaving}
                  />
                ) : null}
              </>
            ) : null}

            {!showRewriteGate &&
              workflowPhase !== WORKFLOW_PHASES.DONE &&
              workspaceTab === 'jobDescription' ? (
              <div className="flex-1 overflow-y-auto p-6 lg:p-12 bg-slate-50">
                <div className="max-w-[800px] mx-auto bg-white p-8 lg:p-12 shadow-[0_4px_20px_rgba(0,0,0,0.05)] text-sm text-slate-700 whitespace-pre-wrap leading-relaxed min-h-[400px]">
                  {analysis.jobDescription?.rawText ||
                    t('analysis.workspaceEmpty.jobDescription')}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </DashboardLayout>
  );
}
