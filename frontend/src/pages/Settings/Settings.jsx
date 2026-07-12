import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../../components/layout';
import AppIcon from '../../components/icons/AppIcon';
import SettingCard from '../../components/settings/SettingCard';
import { SETTINGS_DASHBOARD_CARDS } from '../../components/settings/settingsConstants';

export default function Settings() {
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
          <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">Account</h1>
          <p className="font-body-md text-on-surface-variant mt-base">
            Manage your account information, security, and preferences.
          </p>
        </header>

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
      </div>
    </DashboardLayout>
  );
}
