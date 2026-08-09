import { useTranslation } from 'react-i18next';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import SectionHeading from '../../../../components/ui/SectionHeading';

export default function RoadmapCard({ learningRoadmap = [], careerSuggestions = [] }) {
  const { t } = useTranslation('interviewPrep');
  if (!learningRoadmap.length && !careerSuggestions.length) return null;

  return (
    <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
      {learningRoadmap.length ? (
        <section className={accentCardClass}>
          <SectionHeading
            color="warning"
            icon="route"
            title={t('report.enterprise.learningRoadmap')}
            alignDescription={false}
          />
          <ul className="space-y-3">
            {learningRoadmap.map((item, index) => (
              <li key={`road-${index}`}>
                <p className="font-label-md app-heading">{item.title}</p>
                {item.why ? <p className="font-body-md text-sm app-muted">{item.why}</p> : null}
                {Array.isArray(item.actions) && item.actions.length ? (
                  <ul className="mt-1 list-disc pl-5 font-body-md text-sm text-on-surface-variant">
                    {item.actions.map((action, actionIndex) => (
                      <li key={`action-${index}-${actionIndex}`}>{action}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {careerSuggestions.length ? (
        <section className={accentCardClass}>
          <SectionHeading
            color="mode"
            icon="work"
            title={t('report.enterprise.careerSuggestions')}
            alignDescription={false}
          />
          <ul className="space-y-3">
            {careerSuggestions.map((item, index) => (
              <li key={`career-${index}`}>
                <p className="font-label-md app-heading">{item.title}</p>
                {item.rationale ? (
                  <p className="font-body-md text-sm text-on-surface-variant">{item.rationale}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
