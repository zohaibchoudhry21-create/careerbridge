import AppIcon from '../../../components/icons/AppIcon';

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
              className={`w-full text-left rounded-xl border p-4 transition-all min-h-[44px] ${
                selected
                  ? 'border-secondary bg-secondary/5'
                  : 'border-outline-variant/40 bg-surface-container-lowest hover:border-secondary/30'
              } disabled:opacity-60`}
            >
              <span className="font-label-md text-on-surface">{option}</span>
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
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev || submitting}
        className="px-4 py-2.5 rounded-xl border border-outline-variant font-label-md min-h-[44px] disabled:opacity-50"
      >
        Previous
      </button>

      {isLast ? (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canNext || submitting}
          className="px-6 py-2.5 rounded-xl bg-secondary text-white font-label-md min-h-[44px] inline-flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <AppIcon name="progress_activity" size="sm" spin />
              Submitting…
            </>
          ) : (
            'Submit quiz'
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext || submitting}
          className="px-6 py-2.5 rounded-xl bg-secondary text-white font-label-md min-h-[44px] disabled:opacity-60"
        >
          Next
        </button>
      )}
    </div>
  );
}
