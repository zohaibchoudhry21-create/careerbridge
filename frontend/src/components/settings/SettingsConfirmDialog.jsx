import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../icons/AppIcon';
import Button from '../ui/Button';

export default function SettingsConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = 'primary',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation('common');
  const resolvedConfirmLabel = confirmLabel || t('buttons.confirm');
  const resolvedCancelLabel = cancelLabel || t('buttons.cancel');

  useEffect(() => {
    if (!open) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('buttons.closeDialog')}
        className="absolute inset-0 bg-on-surface/40 backdrop-blur-[2px]"
        onClick={loading ? undefined : onCancel}
        disabled={loading}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-confirm-title"
        className="relative w-full max-w-md rounded-2xl border border-outline-variant/40 bg-white p-6 shadow-lg space-y-4"
      >
        <div className="space-y-2">
          <h2 id="settings-confirm-title" className="font-headline-section text-headline-section text-on-surface">
            {title}
          </h2>
          {description ? (
            <p className="font-body-md text-sm text-on-surface-variant">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="min-h-[44px] px-4 py-2.5"
          >
            {resolvedCancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'destructive' ? 'destructive' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
            className="min-h-[44px] gap-2 px-4 py-2.5"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {resolvedConfirmLabel}...
              </>
            ) : (
              resolvedConfirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AccountDeletedState() {
  const { t } = useTranslation('settings');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <AppIcon name="check_circle" size="dashboard" className="text-primary" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="font-headline-section text-headline-section text-on-surface">
          {t('account.delete.successTitle')}
        </h2>
        <p className="font-body-md text-on-surface-variant">{t('account.delete.successDescription')}</p>
      </div>
      <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
    </div>
  );
}

export function AccountDeactivatedState() {
  const { t } = useTranslation('settings');

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-warning/10">
        <AppIcon name="pause_circle" size="dashboard" className="text-warning" />
      </div>
      <div className="space-y-2 max-w-md">
        <h2 className="font-headline-section text-headline-section text-on-surface">
          {t('account.deactivate.successTitle')}
        </h2>
        <p className="font-body-md text-on-surface-variant">{t('account.deactivate.successDescription')}</p>
      </div>
      <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
    </div>
  );
}
