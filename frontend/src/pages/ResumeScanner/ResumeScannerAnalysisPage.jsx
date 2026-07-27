import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import { buttonSecondaryClass } from '../../components/ui/buttonTokens';
import { useResumeScannerAnalysis } from '../../features/resumeScanner/hooks/useResumeScanner';
import { resolveApiError } from '../../utils/apiError';

export default function ResumeScannerAnalysisPage() {
  const { analysisId } = useParams();
  const { t } = useTranslation('resumeScanner');
  const { user } = useAuth();
  const { data: analysis, isLoading, isError, error } = useResumeScannerAnalysis(analysisId, true);

  return (
    <DashboardLayout user={user}>
      <PageContainer>
        <PageHeader
          title={t('page.analysisPlaceholder.title')}
          description={t('page.analysisPlaceholder.description')}
          actions={
            <Link to="/resume-scanner" className={buttonSecondaryClass}>
              {t('page.analysisPlaceholder.backToUpload')}
            </Link>
          }
        />

        {isLoading ? (
          <p className="font-body-md text-on-surface-variant">{t('page.analysisPlaceholder.loading')}</p>
        ) : null}

        {isError ? (
          <p className="font-body-md text-error" role="alert">
            {resolveApiError(error, t('overlay.failed'))}
          </p>
        ) : null}

        {analysis ? (
          <div className="dashboard-glass-card rounded-2xl p-lg max-w-md">
            <p className="font-label-sm text-on-surface-variant mb-1">
              {t('page.analysisPlaceholder.scoreLabel')}
            </p>
            <p className="font-display-lg text-display-lg text-secondary">{analysis.jobMatchScore}</p>
            <p className="font-body-md text-on-surface-variant mt-sm">
              ATS: {analysis.atsScore}
            </p>
            {analysis.jobDescription?.title ? (
              <p className="font-body-md text-on-surface mt-sm">{analysis.jobDescription.title}</p>
            ) : null}
          </div>
        ) : null}
      </PageContainer>
    </DashboardLayout>
  );
}
