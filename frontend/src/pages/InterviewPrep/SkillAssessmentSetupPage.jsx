import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import useAuth from '../../hooks/useAuth';
import AppIcon from '../../components/icons/AppIcon';
import SkillAssessmentSetup from '../../features/interviewPrep/components/SkillAssessmentSetup';

export default function SkillAssessmentSetupPage() {
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
        <Link
          to="/interview-prep"
          className="inline-flex items-center gap-1 font-label-md text-secondary hover:underline"
        >
          <AppIcon name="arrow_back" size="sm" />
          Interview Prep
        </Link>
        <SkillAssessmentSetup />
      </div>
    </DashboardLayout>
  );
}
