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
  if (!question) return null;

  return (
    <article className="dashboard-glass-card dashboard-card-padding rounded-2xl min-w-0 space-y-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-label-sm text-on-surface-variant">
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        {question.subtopic ? (
          <span className="font-label-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded-full">
            {question.subtopic}
          </span>
        ) : null}
      </div>

      <h2 className="font-headline-section text-headline-section text-on-surface">{question.question}</h2>

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
                'w-full min-h-[44px] rounded-xl border-2 p-4 text-left transition-all duration-150',
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
  const percent = total > 0 ? Math.round(((current + 1) / total) * 100) : 0;

  return (
    <div className="min-w-0 space-y-1">
      <div className="flex justify-between font-label-sm text-on-surface-variant">
        <span>
          Progress {current + 1}/{total}
        </span>
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
  return (
    <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 pt-sm">
      <Button
        type="button"
        variant="secondary"
        onClick={onPrev}
        disabled={!canPrev || submitting}
        className="min-h-[44px] px-4 py-2.5 disabled:opacity-50"
      >
        Previous
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
              Submitting…
            </>
          ) : (
            'Submit quiz'
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
          Next
        </Button>
      )}
    </div>
  );
}
