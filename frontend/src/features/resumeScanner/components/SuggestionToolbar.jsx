import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';
import { WORKFLOW_PHASES, getPhaseActions } from '../utils/workflowPhases';

/**
 * Improve / Finalize toolbar.
 * New Analysis lives in the page header only (no duplicate CTA here).
 */
export default function SuggestionToolbar({
  suggestionStats,
  history,
  phase = WORKFLOW_PHASES.IMPROVE,
  onUndo,
  onRedo,
  onAcceptAll,
  onContinueToFinalize,
  onBackToImprove,
  onFinish,
  onDownloadPdf,
  showDownloadPdf = false,
  isUndoing = false,
  isRedoing = false,
  isAcceptingAll = false,
  isSuggestionBusy = false,
  isFinishing = false,
  isDownloadingPdf = false,
}) {
  const { t } = useTranslation('resumeScanner');
  const actions = getPhaseActions(phase);
  const accepted = suggestionStats?.accepted ?? 0;
  const total = suggestionStats?.total ?? 0;
  const pending = suggestionStats?.pending ?? 0;
  const progress = total > 0 ? Math.round((accepted / total) * 100) : 0;
  const acceptDisabled = pending === 0 || isAcceptingAll || isSuggestionBusy;
  const isImprove = phase === WORKFLOW_PHASES.IMPROVE;
  const isFinalize = phase === WORKFLOW_PHASES.FINALIZE;

  return (
    <div className="px-6 lg:px-8 py-4 bg-white border-b border-slate-200 flex flex-col gap-3 shrink-0">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div
          className="flex items-center gap-4 sm:gap-6"
          role="navigation"
          aria-label={t('analysis.steps.ariaLabel')}
        >
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                isImprove ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
              )}
            >
              {isFinalize || phase === WORKFLOW_PHASES.DONE ? '✓' : '1'}
            </div>
            <span
              className={cn(
                'text-sm',
                isImprove ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
              )}
            >
              {t('analysis.phases.improve')}
              {isImprove && total > 0
                ? ` (${accepted}/${total})`
                : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                isFinalize ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'
              )}
            >
              2
            </div>
            <span
              className={cn(
                'text-sm',
                isFinalize ? 'font-bold text-slate-900' : 'font-medium text-slate-400'
              )}
            >
              {t('analysis.phases.finalize')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap justify-end">
          {actions.showUndoRedo ? (
            <div className="flex items-center gap-1 mr-1">
              <button
                type="button"
                disabled={!history?.canUndo || isUndoing}
                onClick={onUndo}
                className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors disabled:opacity-40"
                aria-label={t('analysis.toolbar.undo')}
              >
                <AppIcon name="undo-2" size="nav" />
              </button>
              <button
                type="button"
                disabled={!history?.canRedo || isRedoing}
                onClick={onRedo}
                className="p-2 hover:bg-slate-50 text-slate-400 rounded-lg transition-colors disabled:opacity-40"
                aria-label={t('analysis.toolbar.redo')}
              >
                <AppIcon name="redo-2" size="nav" />
              </button>
            </div>
          ) : null}

          {actions.showAcceptAll ? (
            <button
              type="button"
              disabled={acceptDisabled}
              onClick={onAcceptAll}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              aria-busy={isAcceptingAll || isSuggestionBusy}
            >
              {t('analysis.toolbar.acceptAll')}
            </button>
          ) : null}

          {isFinalize && typeof onBackToImprove === 'function' ? (
            <button
              type="button"
              onClick={onBackToImprove}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
            >
              {t('analysis.toolbar.backToImprove')}
            </button>
          ) : null}

          {actions.showContinue ? (
            <button
              type="button"
              onClick={onContinueToFinalize}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              {t('analysis.toolbar.continueToFinalize')}
            </button>
          ) : null}

          {showDownloadPdf && typeof onDownloadPdf === 'function' ? (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              aria-busy={isDownloadingPdf}
            >
              {isDownloadingPdf
                ? t('analysis.toolbar.downloadingPdf')
                : t('analysis.toolbar.downloadPdf')}
            </button>
          ) : null}

          {actions.showFinish ? (
            <button
              type="button"
              onClick={onFinish}
              disabled={isFinishing}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {t('analysis.toolbar.finish')}
            </button>
          ) : null}
        </div>
      </div>

      {isImprove ? (
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t('analysis.toolbar.suggestionProgressAria', { accepted, total })}
          />
        </div>
      ) : null}
    </div>
  );
}
