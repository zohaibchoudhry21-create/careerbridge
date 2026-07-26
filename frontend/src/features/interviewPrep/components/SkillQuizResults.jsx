import { Link } from 'react-router-dom';
import AppIcon from '../../../components/icons/AppIcon';
import SectionHeading from '../../../components/ui/SectionHeading';
import { accentCardClass } from '../../../components/ui/colorAccentTokens';
import { buttonPrimaryClass, buttonSecondaryClass } from '../../../components/ui/buttonTokens';
import { cn } from '../../../lib/utils';

export default function SkillQuizResults({ result }) {
  if (!result) return null;

  const { percentage, score, total, weakAreas = [], reviewList = [] } = result;

  return (
    <div className="min-w-0 space-y-md">
      <header className="dashboard-glass-card dashboard-card-padding rounded-2xl text-center">
        <p className="font-label-md text-on-surface-variant">Your score</p>
        <p className="mt-1 font-headline-dashboard text-headline-dashboard text-secondary">
          {percentage}%
        </p>
        <p className="mt-1 font-body-md text-on-surface-variant">
          {score} of {total} correct
        </p>
      </header>

      {weakAreas.length > 0 ? (
        <section className={accentCardClass}>
          <SectionHeading
            color="warning"
            icon="trending_down"
            title="Weak areas"
            description="Subtopics where you missed the most questions — focus here next."
          />
          <ul className="space-y-2">
            {weakAreas.map((area) => (
              <li
                key={area.subtopic}
                className="flex items-center justify-between gap-2 rounded-xl bg-surface-container-low px-3 py-2"
              >
                <span className="font-label-md capitalize text-on-surface">{area.subtopic}</span>
                <span className="font-label-sm text-on-surface-variant">
                  {area.accuracy}% ({area.correct}/{area.total})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {reviewList.length > 0 ? (
        <section className={accentCardClass}>
          <SectionHeading
            color="danger"
            icon="rate_review"
            title="Review mistakes"
            description="See what you missed and the correct answers."
          />
          <ul className="space-y-md">
            {reviewList.map((item) => (
              <li key={item.questionId} className="border-b border-outline-variant/30 pb-md last:border-0">
                <p className="font-label-md text-on-surface">{item.question}</p>
                <p className="mt-1 font-body-md text-sm text-error">
                  Your answer: {item.selectedIndex != null ? item.options?.[item.selectedIndex] : '—'}
                </p>
                <p className="mt-0.5 font-body-md text-sm text-secondary">
                  Correct: {item.options?.[item.correctIndex]}
                </p>
                {item.explanation ? (
                  <p className="mt-2 font-body-md text-sm text-on-surface-variant">{item.explanation}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          to="/interview-prep/skills"
          className={cn(buttonPrimaryClass, 'min-h-[44px] px-6 py-2.5 text-center')}
        >
          Take another quiz
        </Link>
        <Link
          to="/interview-prep"
          className={cn(buttonSecondaryClass, 'min-h-[44px] px-6 py-2.5 text-center')}
        >
          Back to Interview Prep
        </Link>
      </div>
    </div>
  );
}

export function SkillQuizResultsLoading() {
  return (
    <div className="flex justify-center py-xl">
      <AppIcon name="progress_activity" size="dashboard" spin className="text-secondary" />
    </div>
  );
}
