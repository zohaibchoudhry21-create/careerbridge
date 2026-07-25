import { Link } from 'react-router-dom';
import AppIcon from '../../../components/icons/AppIcon';

export default function SkillQuizResults({ result }) {
  if (!result) return null;

  const { percentage, score, total, weakAreas = [], reviewList = [] } = result;

  return (
    <div className="min-w-0 space-y-md">
      <header className="dashboard-glass-card dashboard-card-padding rounded-2xl text-center">
        <p className="font-label-md text-on-surface-variant">Your score</p>
        <p className="font-headline-dashboard text-headline-dashboard text-secondary mt-1">
          {percentage}%
        </p>
        <p className="font-body-md text-on-surface-variant mt-1">
          {score} of {total} correct
        </p>
      </header>

      {weakAreas.length > 0 ? (
        <section className="dashboard-glass-card dashboard-card-padding rounded-2xl space-y-sm">
          <h2 className="font-headline-section text-headline-section">Weak areas</h2>
          <p className="font-body-md text-on-surface-variant text-sm">
            Subtopics where you missed the most questions — focus here next.
          </p>
          <ul className="space-y-2">
            {weakAreas.map((area) => (
              <li
                key={area.subtopic}
                className="flex justify-between items-center gap-2 rounded-xl bg-surface-container-low px-3 py-2"
              >
                <span className="font-label-md text-on-surface capitalize">{area.subtopic}</span>
                <span className="font-label-sm text-on-surface-variant">
                  {area.accuracy}% ({area.correct}/{area.total})
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {reviewList.length > 0 ? (
        <section className="dashboard-glass-card dashboard-card-padding rounded-2xl space-y-sm">
          <h2 className="font-headline-section text-headline-section">Review mistakes</h2>
          <ul className="space-y-md">
            {reviewList.map((item) => (
              <li key={item.questionId} className="border-b border-outline-variant/30 pb-md last:border-0">
                <p className="font-label-md text-on-surface">{item.question}</p>
                <p className="font-body-md text-error text-sm mt-1">
                  Your answer: {item.selectedIndex != null ? item.options?.[item.selectedIndex] : '—'}
                </p>
                <p className="font-body-md text-secondary text-sm mt-0.5">
                  Correct: {item.options?.[item.correctIndex]}
                </p>
                {item.explanation ? (
                  <p className="font-body-md text-on-surface-variant text-sm mt-2">{item.explanation}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          to="/interview-prep/skills"
          className="px-6 py-2.5 rounded-xl bg-secondary text-white font-label-md text-center min-h-[44px] inline-flex items-center justify-center"
        >
          Take another quiz
        </Link>
        <Link
          to="/interview-prep"
          className="px-6 py-2.5 rounded-xl border border-outline-variant font-label-md text-center min-h-[44px] inline-flex items-center justify-center"
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
