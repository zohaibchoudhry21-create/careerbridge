import useAuth from '../../hooks/useAuth';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import AppIcon from '../../components/icons/AppIcon';
import SettingCard from '../../components/settings/SettingCard';
import { SETTINGS_DASHBOARD_CARDS } from '../../components/settings/settingsConstants';

export default function Settings() {
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
          title="Account"
          description="Manage your account information, security, and preferences."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sm min-w-0">
          {SETTINGS_DASHBOARD_CARDS.map((section) => (
            <SettingCard
              key={section.id}
              title={section.title}
              description={section.description}
              icon={section.icon}
              to={section.to}
              accent={section.accent}
            />
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
