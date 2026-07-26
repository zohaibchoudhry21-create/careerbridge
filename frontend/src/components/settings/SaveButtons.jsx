import Button from '../ui/Button';

export default function SaveButtons({
  onSave,
  onCancel,
  saveLabel = 'Save Changes',
  cancelLabel = 'Cancel',
  saving = false,
  disabled = false,
  className = '',
}) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 ${className}`}>
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={saving}
        className="min-h-[44px] px-4 py-2.5"
      >
        {cancelLabel}
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
            Saving...
          </>
        ) : (
          saveLabel
        )}
      </Button>
    </div>
  );
}
