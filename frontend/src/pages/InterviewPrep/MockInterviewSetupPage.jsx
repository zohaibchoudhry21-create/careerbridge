import { DashboardLayout, PageContainer, BackLink } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
import MockInterviewSetup from '../../features/interviewPrep/components/MockInterviewSetup';

export default function MockInterviewSetupPage() {
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
        <BackLink to="/interview-prep">Interview Prep</BackLink>
        <MockInterviewSetup />
      </PageContainer>
    </DashboardLayout>
  );
}
