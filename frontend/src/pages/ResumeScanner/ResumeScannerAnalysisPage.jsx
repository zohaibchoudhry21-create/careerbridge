import { useCallback, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import { buttonSecondaryClass } from '../../components/ui/buttonTokens';
import ResumeEditor from '../../features/resumeScanner/components/ResumeEditor';
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

  const [isSavingText, setIsSavingText] = useState(false);

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

  const handleTextChange = useCallback(
    async (resumeText) => {
      setIsSavingText(true);
      try {
        await textMutation.mutateAsync(resumeText);
      } catch (mutationError) {
        toast.error(resolveApiError(mutationError, t('analysis.errors.textFailed')));
      } finally {
        setIsSavingText(false);
      }
    },
    [textMutation, t]
  );

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

  const jobTitle = analysis?.jobDescription?.title || t('analysis.defaultJobTitle');
  const company = analysis?.jobDescription?.company;

  return (
    <DashboardLayout user={user}>
      <PageContainer>
        <PageHeader
          title={jobTitle}
          description={
            company
              ? t('analysis.headerDescriptionWithCompany', { company })
              : t('analysis.headerDescription')
          }
          actions={
            <Link to="/resume-scanner" className={buttonSecondaryClass}>
              {t('analysis.backToUpload')}
            </Link>
          }
        />

        {isLoading ? (
          <p className="font-body-md text-on-surface-variant">{t('analysis.loading')}</p>
        ) : null}

        {isError ? (
          <p className="font-body-md text-error" role="alert">
            {resolveApiError(error, t('overlay.failed'))}
          </p>
        ) : null}

        {analysis ? (
          <div className="space-y-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-md items-start">
              <div className="lg:col-span-4 min-w-0">
                <SkillsSidebar analysis={analysis} />
              </div>
              <div className="lg:col-span-8 min-w-0 space-y-md">
                <ResumeEditor
                  resumeText={analysis.resumeText}
                  suggestions={analysis.suggestions}
                  onTextChange={handleTextChange}
                  onSuggestionAction={handleSuggestionAction}
                  isSaving={isSavingText || textMutation.isPending}
                  isSuggestionLoading={suggestionMutation.isPending}
                />
                <SuggestionToolbar
                  suggestionStats={analysis.suggestionStats}
                  history={analysis.history}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onAcceptAll={handleAcceptAll}
                  isUndoing={undoMutation.isPending}
                  isRedoing={redoMutation.isPending}
                  isAcceptingAll={acceptAllMutation.isPending}
                />
              </div>
            </div>
          </div>
        ) : null}
      </PageContainer>
    </DashboardLayout>
  );
}
