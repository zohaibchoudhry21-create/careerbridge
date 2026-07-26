import { useTranslation } from 'react-i18next';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
import InterviewPrepHub from '../../features/interviewPrep/components/InterviewPrepHub';

export default function InterviewPrepPage() {
  const { t } = useTranslation('interviewPrep');
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center py-xl">
          <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
        </div>
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
