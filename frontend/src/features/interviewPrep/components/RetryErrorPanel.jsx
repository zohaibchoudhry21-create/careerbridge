import { useTranslation } from 'react-i18next';
import Button from '../../../components/ui/Button';

export default function RetryErrorPanel({
  title,
  message,
  onRetry,
  retryLabel,
}) {
  const { t } = useTranslation('interviewPrep');

  if (!message) return null;

  const resolvedTitle = title ?? t('retry.title');
  const resolvedRetryLabel = retryLabel ?? t('retry.tryAgain');

  return (
    <div
      className="dashboard-glass-card dashboard-card-padding rounded-2xl border border-error/20 space-y-sm"
      role="alert"
    >
      <p className="font-label-md app-heading">{resolvedTitle}</p>
      <p className="font-body-md text-error text-sm">{message}</p>
      {onRetry ? (
        <Button type="button" variant="primary" onClick={onRetry} className="min-h-[44px] px-4 py-2.5">
          {resolvedRetryLabel}
        </Button>
      ) : null}
    </div>
  );
}
