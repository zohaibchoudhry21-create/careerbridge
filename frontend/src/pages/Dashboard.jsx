import { useTranslation } from 'react-i18next';
import { resolveApiError } from '../utils/apiError';
import useAuth from '../hooks/useAuth';
import { useDashboardOverview } from '../hooks/useDashboard';
import { DashboardLayout, PageContainer } from '../components/layout';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import QuickActions from '../components/dashboard/QuickActions';
import DashboardFeatureSection from '../components/dashboard/DashboardFeatureSection';
import ResumeBuilderCard from '../components/dashboard/ResumeBuilderCard';
import ResumeScannerSection from '../components/dashboard/ResumeScannerSection';
import InterviewReadinessCard from '../components/dashboard/InterviewReadinessCard';
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
        <QuickActions />

        <DashboardFeatureSection
          title={t('dashboard:features.resumeBuilder.title')}
          description={t('dashboard:features.resumeBuilder.description')}
          href="/resume/upload"
          icon="description"
          color="resume"
        >
          <ResumeBuilderCard />
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

        <DashboardFeatureSection
          title={t('dashboard:features.interviewPrep.title')}
          description={t('dashboard:features.interviewPrep.description')}
          href="/interview-prep"
          icon="mic_external_on"
          color="mode"
        >
          <InterviewReadinessCard interviewReadiness={data?.interviewReadiness} />
        </DashboardFeatureSection>
      </PageContainer>
    </DashboardLayout>
  );
}
