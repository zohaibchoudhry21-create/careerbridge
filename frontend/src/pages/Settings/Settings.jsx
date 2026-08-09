import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout, PageContainer, PageHeader } from '../../components/layout';
import Skeleton from '../../components/Skeleton';
import SettingCard from '../../components/settings/SettingCard';
import { useSettingsCards } from '../../hooks/useSettingsCards';
export default function Settings() {
  const { user, loading } = useAuth();
  const { t } = useTranslation('settings');
  const settingsCards = useSettingsCards();

  if (loading || !user) {
    return (
      <DashboardLayout user={user}>
        <PageContainer>
          <Skeleton type="card" count={4} withMedia={false} lines={2} columnsGrid={2} label="Loading settings" />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <PageContainer>
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
