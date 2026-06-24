import { useMemo } from 'react';
import useAuth from '../hooks/useAuth';
import { useDashboardOverview, useJobMatches } from '../hooks/useDashboard';
import { DashboardLayout } from '../components/layout';
import WelcomeSection from '../components/dashboard/WelcomeSection';
import QuickActions from '../components/dashboard/QuickActions';
import ProfileStrengthCard from '../components/dashboard/ProfileStrengthCard';
import ResumeIntelligenceCard from '../components/dashboard/ResumeIntelligenceCard';
import InterviewReadinessCard from '../components/dashboard/InterviewReadinessCard';
import JobMatchesSection from '../components/dashboard/JobMatchesSection';
import CareerRiskCard from '../components/dashboard/CareerRiskCard';
import DashboardLoading from '../components/dashboard/DashboardLoading';
import DashboardError from '../components/dashboard/DashboardError';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboardOverview();
  const { data: jobsData } = useJobMatches();

  const jobMatches = useMemo(() => {
    if (jobsData?.matches?.length) return jobsData.matches;
    return data?.jobMatchesPreview || [];
  }, [jobsData, data]);

  if (isLoading) {
    return (
      <DashboardLayout user={user}>
        <DashboardLoading />
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout user={user}>
        <DashboardError
          message={error?.response?.data?.message || error?.message || 'Something went wrong.'}
          onRetry={refetch}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <WelcomeSection welcome={data?.welcome} />
      <QuickActions />

      <div className="dashboard-content-grid">
        <ProfileStrengthCard profileStrength={data?.profileStrength} />
        <ResumeIntelligenceCard resumeIntelligence={data?.resumeIntelligence} />

        <div className="col-span-1 lg:col-span-4 space-y-dashboard-gutter min-w-0">
          <InterviewReadinessCard interviewReadiness={data?.interviewReadiness} />
        </div>

        <JobMatchesSection matches={jobMatches} />

        <div className="col-span-1 lg:col-span-4 space-y-dashboard-gutter min-w-0">
          <CareerRiskCard careerRisk={data?.careerRisk} />
        </div>
      </div>
    </DashboardLayout>
  );
}
