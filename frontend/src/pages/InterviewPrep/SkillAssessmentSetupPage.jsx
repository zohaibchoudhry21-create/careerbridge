import { useTranslation } from 'react-i18next';
import { DashboardLayout, PageContainer, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
import SkillAssessmentSetup from '../../features/interviewPrep/components/SkillAssessmentSetup';

export default function SkillAssessmentSetupPage() {
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
      <PageContainer width="standard">
        <BackLink to="/interview-prep">{t('backLinks.interviewPrep')}</BackLink>
        <SkillAssessmentSetup />
      </PageContainer>
    </DashboardLayout>
  );
}
