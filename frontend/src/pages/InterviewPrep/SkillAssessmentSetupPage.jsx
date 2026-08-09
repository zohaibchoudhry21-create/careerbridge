import { useTranslation } from 'react-i18next';
import { DashboardLayout, PageContainer, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import Skeleton from '../../components/Skeleton';
import SkillAssessmentSetup from '../../features/interviewPrep/components/SkillAssessmentSetup';

export default function SkillAssessmentSetupPage() {
  const { t } = useTranslation('interviewPrep');
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <PageContainer width="standard">
          <Skeleton type="card" count={3} withMedia={false} lines={4} columnsGrid={1} label="Loading skill assessment setup" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer width="standard">
        <BackLink to="/interview-prep">{t('backLinks.interviewPrep')}</BackLink>
        <SkillAssessmentSetup />
      </PageContainer>
    </DashboardLayout>
  );
}
