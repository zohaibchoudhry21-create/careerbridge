import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout, PageContainer, PageHeader, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import Skeleton from '../../components/Skeleton';
import AppIcon from '../../components/icons/AppIcon';
import MockInterviewSetup from '../../features/interviewPrep/components/MockInterviewSetup';

export default function MockInterviewSetupPage() {
  const { t } = useTranslation('interviewPrep');
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <PageContainer width="wide">
          <Skeleton type="card" count={3} withMedia={false} lines={4} columnsGrid={1} label="Loading mock interview setup" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer width="wide">
        <BackLink to="/interview-prep">{t('backLinks.interviewPrep')}</BackLink>
        <PageHeader
          title={t('mockSetup.title')}
          description={t('mockSetup.description')}
          actions={
            <Link
              to="/interview-prep/mock/history"
              className="inline-flex shrink-0 items-center gap-1 font-label-md text-secondary hover:underline"
            >
              <AppIcon name="history" size="sm" />
              {t('history.navLabel')}
            </Link>
          }
        />
        <MockInterviewSetup />
      </PageContainer>
    </DashboardLayout>
  );
}
