import { useTranslation } from 'react-i18next';
import AppIcon from '../icons/AppIcon';

function DashboardError({ message, onRetry }) {
  const { t } = useTranslation(['dashboard', 'common']);

  return (
    <div className="dashboard-glass-card dashboard-card-padding rounded-2xl text-center max-w-lg mx-auto my-md">
      <AppIcon name="error" size="h-8 w-8" className="text-error mb-sm mx-auto" />
      <p className="dashboard-section-title mb-xs">{t('dashboard:error.title')}</p>
      <p className="font-body-md dashboard-muted mb-md">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-5 py-3 bg-secondary text-white rounded-2xl font-label-md dashboard-btn-glow"
      >
        {t('common:buttons.tryAgain')}
      </button>
    </div>
  );
}

export default DashboardError;
