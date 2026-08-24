import { useTranslation } from 'react-i18next';
import { DashboardLayout, PageContainer, PageHeader, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import Skeleton from '../../components/Skeleton';
import SkillAssessmentSetup from '../../features/interviewPrep/components/SkillAssessmentSetup';

export default function SkillAssessmentSetupPage() {
  const { t } = useTranslation('interviewPrep');
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <PageContainer width="wide">
          <Skeleton
            type="card"
            count={3}
            withMedia={false}
            lines={4}
            columnsGrid={1}
            label="Loading skill assessment setup"
          />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer width="wide">
        <BackLink to="/interview-prep">{t('backLinks.interviewPrep')}</BackLink>
        <PageHeader title={t('skillSetup.title')} description={t('skillSetup.description')} />
        <SkillAssessmentSetup />
      </PageContainer>
    </DashboardLayout>
  );
}
