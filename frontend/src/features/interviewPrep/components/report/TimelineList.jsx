import { useTranslation } from 'react-i18next';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import SectionHeading from '../../../../components/ui/SectionHeading';

export default function TimelineList({ timeline = [] }) {
  const { t } = useTranslation('interviewPrep');
  if (!timeline.length) return null;

  return (
    <section className={accentCardClass}>
      <SectionHeading
        color="time"
        icon="timeline"
        title={t('report.enterprise.timeline')}
        alignDescription={false}
      />
      <ul className="space-y-2">
        {timeline.slice(0, 40).map((event, index) => (
          <li key={`${event.tMs}-${index}`} className="flex gap-3 font-body-md text-sm">
            <span className="w-14 shrink-0 font-label-md text-secondary">
              {event.offsetLabel || '00:00'}
            </span>
            <span className="text-on-surface-variant">{event.message}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
