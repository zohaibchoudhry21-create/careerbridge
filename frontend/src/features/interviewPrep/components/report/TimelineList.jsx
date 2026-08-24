import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../../components/icons/AppIcon';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import SectionHeading from '../../../../components/ui/SectionHeading';

const COLLAPSED_COUNT = 8;
const MAX_EVENTS = 40;

export default function TimelineList({ timeline = [] }) {
  const { t } = useTranslation('interviewPrep');
  const [expanded, setExpanded] = useState(false);

  if (!timeline.length) return null;

  const events = timeline.slice(0, MAX_EVENTS);
  const visible = expanded ? events : events.slice(0, COLLAPSED_COUNT);
  const canToggle = events.length > COLLAPSED_COUNT;

  return (
    <section className={accentCardClass}>
      <SectionHeading
        color="time"
        icon="timeline"
        title={t('report.enterprise.timeline')}
        alignDescription={false}
      />
      <ul className="space-y-2">
        {visible.map((event, index) => (
          <li key={`${event.tMs}-${index}`} className="flex gap-3 font-body-md text-sm">
            <span className="w-14 shrink-0 font-label-md text-secondary">
              {event.offsetLabel || '00:00'}
            </span>
            <span className="text-on-surface-variant">{event.message}</span>
          </li>
        ))}
      </ul>

      {canToggle ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1 font-label-md text-secondary hover:underline"
        >
          <AppIcon name={expanded ? 'expand_less' : 'expand_more'} size="sm" />
          {expanded
            ? t('report.timeline.showLess')
            : t('report.timeline.showAll', { count: events.length })}
        </button>
      ) : null}
    </section>
  );
}
