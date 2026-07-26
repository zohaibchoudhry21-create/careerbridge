import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

export default function SaveButtons({
  onSave,
  onCancel,
  saveLabel,
  cancelLabel,
  saving = false,
  disabled = false,
  className = '',
}) {
  const { t } = useTranslation('common');
  const resolvedSaveLabel = saveLabel || t('buttons.saveChanges');
  const resolvedCancelLabel = cancelLabel || t('buttons.cancel');

  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:gap-2 rtl:sm:flex-row-reverse ${className}`}>
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={saving}
        className="min-h-[44px] px-4 py-2.5"
      >
        {resolvedCancelLabel}
      </Button>
      <Button
        type="button"
        variant="primary"
        onClick={onSave}
        disabled={saving || disabled}
        className="min-h-[44px] gap-2 px-4 py-2.5"
      >
        {saving ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t('buttons.saving')}
          </>
        ) : (
          resolvedSaveLabel
        )}
      </Button>
    </div>
  );
}
