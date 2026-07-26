import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../icons/AppIcon';
import SectionIcon from '../ui/SectionIcon';

const riskStyles = {
  LOW: 'bg-green-100 text-green-800',
  MEDIUM: 'bg-error-container text-on-error-container',
  HIGH: 'bg-error-container text-on-error-container',
};

function CareerRiskCard({ careerRisk }) {
  const { t } = useTranslation('dashboard');

  if (!careerRisk) return null;

  const badgeClass = riskStyles[careerRisk.level] || riskStyles.MEDIUM;

  return (
    <div className="min-w-0 rounded-2xl border-l-8 border-error/50 dashboard-glass-card dashboard-card-padding">
      <div className="mb-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <SectionIcon color="danger" icon="warning" />
          <h4 className="font-headline-section text-headline-section">{t('careerRisk.title')}</h4>
        </div>
        <span className={`rounded px-2 py-1 text-[10px] font-bold ${badgeClass}`}>
          {careerRisk.level}
        </span>
      </div>
      <div className="space-y-sm">
        <p className="text-[14px] leading-relaxed">{careerRisk.summary}</p>
        <div className="rounded-xl bg-surface-container p-sm">
          <p className="mb-1 text-[12px] font-bold text-secondary">{t('careerRisk.recommendation')}</p>
          <p className="text-[13px] text-on-surface-variant">{careerRisk.recommendation}</p>
        </div>
        <button
          type="button"
          className="mt-sm flex min-h-[44px] items-center gap-1 text-[12px] font-bold text-secondary"
        >
          {t('careerRisk.browseTracks')}{' '}
          <AppIcon name="open_in_new" size="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default memo(CareerRiskCard);
