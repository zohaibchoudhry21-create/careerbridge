import { useTranslation } from 'react-i18next';
import { cn } from '../../../lib/utils';
import {
  WORKFLOW_PHASES,
  getVisibleAnalysisPhases,
} from '../utils/workflowPhases';

const PHASE_I18N = {
  [WORKFLOW_PHASES.REWRITE_GATE]: 'analysis.phases.rewriteGate',
  [WORKFLOW_PHASES.IMPROVE]: 'analysis.phases.improve',
  [WORKFLOW_PHASES.FINALIZE]: 'analysis.phases.finalize',
  [WORKFLOW_PHASES.DONE]: 'analysis.phases.done',
};

export default function WorkflowPhaseRail({
  currentPhase,
  includeRewriteGate = false,
  className,
}) {
  const { t } = useTranslation('resumeScanner');
  const phases = getVisibleAnalysisPhases(includeRewriteGate);
  const currentIndex = Math.max(0, phases.indexOf(currentPhase));

  return (
    <nav
      className={cn(
        'flex items-center gap-1 sm:gap-2 overflow-x-auto',
        className
      )}
      aria-label={t('analysis.phases.ariaLabel')}
    >
      {phases.map((phase, index) => {
        const isCurrent = phase === currentPhase;
        const isComplete = index < currentIndex;
        return (
          <div key={phase} className="flex items-center gap-1 sm:gap-2 shrink-0">
            {index > 0 ? (
              <span
                className={cn(
                  'h-px w-4 sm:w-6',
                  isComplete || isCurrent ? 'bg-blue-400' : 'bg-slate-200'
                )}
                aria-hidden
              />
            ) : null}
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors',
                isCurrent && 'bg-blue-600 text-white',
                isComplete && !isCurrent && 'bg-blue-50 text-blue-700',
                !isCurrent && !isComplete && 'bg-slate-100 text-slate-400'
              )}
              aria-current={isCurrent ? 'step' : undefined}
            >
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full text-[10px]',
                  isCurrent && 'bg-white/20',
                  isComplete && !isCurrent && 'bg-blue-100',
                  !isCurrent && !isComplete && 'bg-slate-200'
                )}
              >
                {isComplete ? '✓' : index + 1}
              </span>
              <span className="whitespace-nowrap">{t(PHASE_I18N[phase])}</span>
            </div>
          </div>
        );
      })}
    </nav>
  );
}
