import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { buttonPrimaryClass, buttonSecondaryClass } from '../../../components/ui/buttonTokens';
import { cn } from '../../../lib/utils';

export default function SuggestionToolbar({
  suggestionStats,
  history,
  onUndo,
  onRedo,
  onAcceptAll,
  isUndoing = false,
  isRedoing = false,
  isAcceptingAll = false,
}) {
  const { t } = useTranslation('resumeScanner');
  const accepted = suggestionStats?.accepted ?? 0;
  const total = suggestionStats?.total ?? 0;
  const pending = suggestionStats?.pending ?? 0;

  return (
    <div className="dashboard-glass-card rounded-2xl p-md flex flex-col sm:flex-row sm:items-center gap-sm justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-label-md text-on-surface">
          <AppIcon name="sparkles" size="sm" className="text-secondary" />
          <span>{t('analysis.toolbar.accepted', { accepted, total })}</span>
        </div>
        {pending > 0 ? (
          <span className="font-label-sm text-on-surface-variant">
            {t('analysis.toolbar.pending', { count: pending })}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!history?.canUndo || isUndoing}
          onClick={onUndo}
          className={cn(buttonSecondaryClass, 'px-3 py-2 text-sm gap-1.5')}
        >
          <AppIcon name="undo-2" size="sm" />
          {t('analysis.toolbar.undo')}
        </button>
        <button
          type="button"
          disabled={!history?.canRedo || isRedoing}
          onClick={onRedo}
          className={cn(buttonSecondaryClass, 'px-3 py-2 text-sm gap-1.5')}
        >
          <AppIcon name="redo-2" size="sm" />
          {t('analysis.toolbar.redo')}
        </button>
        <button
          type="button"
          disabled={pending === 0 || isAcceptingAll}
          onClick={onAcceptAll}
          className={cn(buttonSecondaryClass, 'px-3 py-2 text-sm')}
        >
          {t('analysis.toolbar.acceptAll')}
        </button>
        <Link to="/resume-scanner" className={cn(buttonPrimaryClass, 'px-4 py-2 text-sm')}>
          {t('analysis.toolbar.continue')}
        </Link>
      </div>
    </div>
  );
}
