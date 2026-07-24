export default function RetryErrorPanel({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}) {
  if (!message) return null;

  return (
    <div
      className="dashboard-glass-card dashboard-card-padding rounded-2xl border border-error/20 space-y-sm"
      role="alert"
    >
      <p className="font-label-md text-on-surface">{title}</p>
      <p className="font-body-md text-error text-sm">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2.5 rounded-xl bg-secondary text-white font-label-md min-h-[44px]"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  );
}
