import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
import InterviewPrepHub from '../../features/interviewPrep/components/InterviewPrepHub';

export default function InterviewPrepPage() {
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
        <PageHeader
          title="Interview Prep"
          description="Practice interviews and test your skills with AI-powered assessments."
        />
        <InterviewPrepHub />
      </PageContainer>
    </DashboardLayout>
  );
}
