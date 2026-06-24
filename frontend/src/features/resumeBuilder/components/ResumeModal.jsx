export default function ResumeModal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
  footer = null,
}) {
  if (!open) return null;

  const sizeClass =
    size === 'lg'
      ? 'sm:max-w-5xl'
      : size === 'xl'
        ? 'sm:max-w-6xl'
        : size === 'sm'
          ? 'sm:max-w-md'
          : 'sm:max-w-xl';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-md">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`relative w-full ${sizeClass} max-h-[92vh] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-outline-variant bg-white shadow-level-2 flex flex-col`}
      >
        {(title || showClose) && (
          <div className="flex items-center justify-between gap-sm border-b border-outline-variant/30 px-lg py-md shrink-0">
            {title ? (
              <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
            ) : (
              <span />
            )}
            {showClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg text-on-surface-variant hover:text-secondary hover:bg-surface-container transition-colors"
                aria-label="Close"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="border-t border-outline-variant/30 bg-white px-lg py-md shrink-0">{footer}</div>
        )}
      </div>
    </div>
  );
}
