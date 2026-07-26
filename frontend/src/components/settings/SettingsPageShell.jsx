import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout, PageContainer, PageHeader, BackLink } from '../layout';
import AppIcon from '../icons/AppIcon';
import SaveButtons from './SaveButtons';

export default function SettingsPageShell({
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
  saving = false,
  saveDisabled = false,
  showActions = true,
  footer,
}) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useTranslation(['settings', 'common']);

  const resolvedSaveLabel = saveLabel || t('common:buttons.saveChanges');
  const resolvedCancelLabel = cancelLabel || t('common:buttons.cancel');

  const handleBack = () => navigate('/settings');
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/settings');
    }
  };

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
        <BackLink onClick={handleBack}>{t('common:back.toSettings')}</BackLink>

        <PageHeader title={title} description={description} />

        <div className="space-y-md">{children}</div>

        {showActions && onSave ? (
          <SaveButtons
            onSave={onSave}
            onCancel={handleCancel}
            saveLabel={resolvedSaveLabel}
            cancelLabel={resolvedCancelLabel}
            saving={saving}
            disabled={saveDisabled}
          />
        ) : null}

        {footer}
      </PageContainer>
    </DashboardLayout>
  );
}

export function simulateSave(delay = 900) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}
