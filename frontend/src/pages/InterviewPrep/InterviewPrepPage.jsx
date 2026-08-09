import { useTranslation } from 'react-i18next';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import Skeleton from '../../components/Skeleton';
import InterviewPrepHub from '../../features/interviewPrep/components/InterviewPrepHub';

export default function InterviewPrepPage() {
  const { t } = useTranslation('interviewPrep');
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <PageContainer>
          <Skeleton type="card" count={2} withMedia lines={3} columnsGrid={2} label="Loading interview prep" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer>
        <PageHeader title={t('page.title')} description={t('page.description')} />
        <InterviewPrepHub />
      </PageContainer>
    </DashboardLayout>
  );
}
