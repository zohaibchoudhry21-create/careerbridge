import Button from '../../../components/ui/Button';

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
        <Button type="button" variant="primary" onClick={onRetry} className="min-h-[44px] px-4 py-2.5">
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
