import { useTranslation } from 'react-i18next';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import SectionHeading from '../../../../components/ui/SectionHeading';

const DECISION_I18N = {
  hire: 'hire',
  lean_hire: 'leanHire',
  hold: 'hold',
  no_hire: 'noHire',
};

export default function HiringCard({ hiringRecommendation, hiringProbability }) {
  const { t } = useTranslation('interviewPrep');
  if (!hiringRecommendation && !hiringProbability) return null;

  const decisionKey = DECISION_I18N[hiringRecommendation?.decision] || 'hold';

  return (
    <section className={accentCardClass}>
      <SectionHeading
        color="success"
        icon="handshake"
        title={t('report.enterprise.hiringRecommendation')}
        alignDescription={false}
      />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-headline-section text-headline-section app-heading">
            {t(`report.enterprise.decision.${decisionKey}`)}
          </p>
          {hiringRecommendation?.rationale ? (
            <p className="mt-2 font-body-md text-on-surface-variant">{hiringRecommendation.rationale}</p>
          ) : null}
        </div>
        {hiringProbability?.percent != null ? (
          <div className="text-right">
            <p className="font-label-sm app-muted">{t('report.enterprise.hiringProbability')}</p>
            <p className="font-headline-section text-headline-section text-secondary">
              {hiringProbability.percent}%
            </p>
            {hiringProbability.band ? (
              <p className="font-label-sm app-muted capitalize">{hiringProbability.band}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
