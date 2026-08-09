import { useTranslation } from 'react-i18next';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import SectionHeading from '../../../../components/ui/SectionHeading';

export default function QuestionReviewList({ questionReviews = [] }) {
  const { t } = useTranslation('interviewPrep');
  if (!questionReviews.length) return null;

  return (
    <section className={accentCardClass}>
      <SectionHeading
        color="focus"
        icon="quiz"
        title={t('report.enterprise.questionReview')}
        alignDescription={false}
      />
      <div className="space-y-3">
        {questionReviews.map((item, index) => (
          <article
            key={item.questionId || index}
            className="rounded-xl border border-outline-variant/40 p-3"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-label-md app-heading">{item.question || `Q${index + 1}`}</p>
              {item.score != null ? (
                <span className="shrink-0 font-label-md text-secondary">{item.score}/100</span>
              ) : null}
            </div>
            {item.answerExcerpt ? (
              <p className="mt-1 font-body-md text-sm app-muted">“{item.answerExcerpt}”</p>
            ) : null}
            {item.feedback ? (
              <p className="mt-2 font-body-md text-sm text-on-surface-variant">{item.feedback}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
