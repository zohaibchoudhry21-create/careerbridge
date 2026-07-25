import { useNavigate } from 'react-router-dom';
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
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  saving = false,
  saveDisabled = false,
  showActions = true,
  footer,
}) {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

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
        <BackLink onClick={handleBack}>Back to Settings</BackLink>

        <PageHeader title={title} description={description} />

        <div className="space-y-md">{children}</div>

        {showActions && onSave ? (
          <SaveButtons
            onSave={onSave}
            onCancel={handleCancel}
            saveLabel={saveLabel}
            cancelLabel={cancelLabel}
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
