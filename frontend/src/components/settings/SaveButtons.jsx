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
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-md ${className}`}>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-4 py-2.5 rounded-xl border border-outline-variant font-label-md text-on-surface hover:bg-surface-container transition-colors min-h-[44px] disabled:opacity-60"
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || disabled}
        className="px-4 py-2.5 rounded-xl bg-secondary text-white font-label-md hover:opacity-90 transition-opacity disabled:opacity-60 min-h-[44px] flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          saveLabel
        )}
      </button>
    </div>
  );
}
