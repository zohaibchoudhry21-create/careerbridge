import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
import InterviewPrepHub from '../../features/interviewPrep/components/InterviewPrepHub';

export default function InterviewPrepPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <div className="flex items-center justify-center py-2xl pt-16 md:pt-20 lg:pt-24">
          <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="min-w-0 space-y-md pt-8 md:pt-10 lg:pt-12">
        <header className="min-w-0">
          <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">
            Interview Prep
          </h1>
          <p className="font-body-md text-on-surface-variant mt-base">
            Practice interviews and test your skills with AI-powered assessments.
          </p>
        </header>
        <InterviewPrepHub />
      </div>
    </DashboardLayout>
  );
}
