import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { DashboardLayout } from '../layout';
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
        <div className="flex items-center justify-center py-2xl">
          <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="min-w-0 max-w-4xl">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 font-label-md text-on-surface-variant hover:text-secondary transition-colors mb-md"
        >
          <AppIcon name="arrow_back" size="button" />
          Back to Settings
        </button>

        <header className="min-w-0 mb-md">
          <h1 className="font-headline-dashboard text-headline-dashboard text-on-surface">{title}</h1>
          {description ? (
            <p className="font-body-md text-on-surface-variant mt-base">{description}</p>
          ) : null}
        </header>

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
      </div>
    </DashboardLayout>
  );
}

export function simulateSave(delay = 900) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, delay);
  });
}
