import { useTranslation } from 'react-i18next';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import SectionHeading from '../../../../components/ui/SectionHeading';
import { cn } from '../../../../lib/utils';
import { LIVE_INTERVIEWER_DISPLAY_NAME } from '../../constants/voiceCallAssistant';

function SpeakerLabel({ name, tone = 'ai' }) {
  return (
    <p
      className={cn(
        'font-label-sm font-semibold',
        tone === 'ai' ? 'text-secondary' : 'text-on-surface'
      )}
    >
      {name}
    </p>
  );
}

export default function QuestionReviewList({
  questionReviews = [],
  aiName,
  userName,
}) {
  const { t } = useTranslation('interviewPrep');
  if (!questionReviews.length) return null;

  const resolvedAiName = aiName || t('live.aiName', { defaultValue: LIVE_INTERVIEWER_DISPLAY_NAME });
  const resolvedUserName = userName || t('session.defaultCandidate');

  return (
    <section className={accentCardClass}>
      <SectionHeading
        color="focus"
        icon="quiz"
        title={t('report.enterprise.questionReview')}
        alignDescription={false}
      />
      <div className="space-y-3">
        {questionReviews.map((item, index) => {
          const answerText = String(item.answerExcerpt || '').trim();
          const hasAnswer = Boolean(answerText);

          return (
            <article
              key={item.questionId || index}
              className="rounded-xl border border-outline-variant/40 p-3"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="font-label-sm app-muted">
                  {t('report.enterprise.questionIndex', { index: index + 1 })}
                </span>
                {item.score != null ? (
                  <span className="shrink-0 font-label-md text-secondary">{item.score}/100</span>
                ) : null}
              </div>

              <div className="space-y-3">
                <div className="flex flex-col items-start">
                  <SpeakerLabel name={resolvedAiName} tone="ai" />
                  <p className="mt-1.5 max-w-[95%] rounded-2xl rounded-tl-sm bg-gradient-to-br from-secondary/[0.08] to-secondary-container/[0.06] px-4 py-2.5 text-sm leading-relaxed text-on-surface shadow-sm">
                    {item.question || t('report.enterprise.questionFallback', { index: index + 1 })}
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <SpeakerLabel name={resolvedUserName} tone="user" />
                  <p
                    className={cn(
                      'mt-1.5 max-w-[95%] rounded-2xl rounded-tr-sm bg-surface-container-low px-4 py-2.5 text-sm leading-relaxed shadow-sm',
                      hasAnswer ? 'text-on-surface' : 'italic text-on-surface-variant'
                    )}
                  >
                    {hasAnswer
                      ? answerText
                      : t('report.enterprise.noAnswerProvided')}
                  </p>
                </div>
              </div>

              {item.feedback ? (
                <p className="mt-3 border-t border-outline-variant/30 pt-2 font-body-md text-sm text-on-surface-variant">
                  {item.feedback}
                </p>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
