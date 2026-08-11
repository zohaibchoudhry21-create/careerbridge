import { useTranslation } from 'react-i18next';
import { resolveApiError } from '../utils/apiError';
import useAuth from '../hooks/useAuth';
import { useDashboardOverview } from '../hooks/useDashboard';
import { DashboardLayout, PageContainer } from '../components/layout';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import DashboardFeatureSection from '../components/dashboard/DashboardFeatureSection';
import ResumeScannerSection from '../components/dashboard/ResumeScannerSection';
import CareerProgressSection from '../components/dashboard/CareerProgressSection';
import DashboardLoading from '../components/dashboard/DashboardLoading';
import DashboardError from '../components/dashboard/DashboardError';

export default function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboardOverview();

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <DashboardLoading />
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout user={user}>
        <DashboardError
          message={resolveApiError(error, t('common:errors.somethingWentWrong'))}
          onRetry={refetch}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer className="space-y-8">
        <WelcomeSection welcome={data?.welcome} />

        <DashboardFeatureSection
          title={t('dashboard:careerProgress.title')}
          description={t('dashboard:careerProgress.description')}
          icon="analytics"
          color="skills"
        >
          <CareerProgressSection careerProgress={data?.careerProgress} />
        </DashboardFeatureSection>

        <DashboardFeatureSection
          title={t('dashboard:features.resumeScanner.title')}
          description={t('dashboard:features.resumeScanner.description')}
          href="/resume-scanner"
          icon="document_scanner"
          color="scanner"
        >
          <ResumeScannerSection
            profileStrength={data?.profileStrength}
            resumeIntelligence={data?.resumeIntelligence}
          />
        </DashboardFeatureSection>
      </PageContainer>
    </DashboardLayout>
  );
}
