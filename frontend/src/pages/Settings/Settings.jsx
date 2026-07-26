import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import AppIcon from '../../components/icons/AppIcon';
import SettingCard from '../../components/settings/SettingCard';
import { useSettingsCards } from '../../hooks/useSettingsCards';
import RtlLanguagePreview from '../../i18n/components/RtlLanguagePreview';

export default function Settings() {
  const { user, loading } = useAuth();
  const { t } = useTranslation('settings');
  const settingsCards = useSettingsCards();

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
        <RtlLanguagePreview />
        <PageHeader title={t('hub.title')} description={t('hub.description')} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-sm min-w-0">
          {settingsCards.map((section) => (
            <SettingCard
              key={section.id}
              title={section.title}
              description={section.description}
              icon={section.icon}
              to={section.to}
              color={section.color}
            />
          ))}
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
