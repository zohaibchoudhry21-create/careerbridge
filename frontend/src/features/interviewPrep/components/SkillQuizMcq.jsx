import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import Button from '../../../components/ui/Button';
import { cn } from '../../../lib/utils';
import {
  selectedOptionClass,
  unselectedOptionClass,
} from '../../../components/ui/colorAccentTokens';

export default function SkillQuizMcq({
  question,
  questionIndex,
  totalQuestions,
  selectedIndex,
  onSelect,
  disabled = false,
}) {
  const { t } = useTranslation('interviewPrep');

  if (!question) return null;

  return (
    <article className="app-surface-card min-w-0 space-y-md rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-label-sm app-muted">
          {t('quiz.questionOf', { current: questionIndex + 1, total: totalQuestions })}
        </span>
        {question.subtopic ? (
          <span className="font-label-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
            {question.subtopic}
          </span>
        ) : null}
      </div>

      <h2 className="font-headline-section text-headline-section app-heading">{question.question}</h2>

      <div className="space-y-2">
        {question.options.map((option, index) => {
          const selected = selectedIndex === index;

          return (
            <button
              key={index}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(index)}
              className={cn(
                'w-full min-h-[44px] rounded-xl border-2 px-4 py-3 text-left transition-all duration-150',
                selected ? selectedOptionClass : unselectedOptionClass,
                disabled && 'opacity-60'
              )}
            >
              <span
                className={cn(
                  'font-label-md',
                  selected ? 'text-secondary' : 'text-on-surface'
                )}
              >
                {option}
              </span>
            </button>
          );
        })}
      </div>
    </article>
  );
}

export function SkillQuizProgress({ current, total }) {
  const { t } = useTranslation('interviewPrep');
  const percent = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex justify-between font-label-sm app-muted">
        <span>{t('quiz.progress', { current: current + 1, total })}</span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
        <div
          className="h-full bg-secondary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function SkillQuizNavButtons({ onPrev, onNext, canPrev, canNext, isLast, onSubmit, submitting }) {
  const { t } = useTranslation('interviewPrep');

  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-sm">
      <Button
        type="button"
        variant="secondary"
        onClick={onPrev}
        disabled={!canPrev || submitting}
        className="min-h-[44px] px-4 py-2.5 disabled:opacity-50"
      >
        {t('quiz.previous')}
      </Button>

      {isLast ? (
        <Button
          type="button"
          variant="primary"
          onClick={onSubmit}
          disabled={!canNext || submitting}
          className="min-h-[44px] gap-2 px-6 py-2.5"
        >
          {submitting ? (
            <>
              <AppIcon name="progress_activity" size="sm" spin />
              {t('quiz.submitting')}
            </>
          ) : (
            t('quiz.submit')
          )}
        </Button>
      ) : (
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={!canNext || submitting}
          className="min-h-[44px] px-6 py-2.5"
        >
          {t('quiz.next')}
        </Button>
      )}
    </div>
  );
}
