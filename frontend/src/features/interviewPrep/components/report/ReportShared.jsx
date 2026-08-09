import SectionHeading from '../../../../components/ui/SectionHeading';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';

export function MetricTile({ label, value, suffix = '' }) {
  return (
    <div className="min-w-0 rounded-2xl text-center dashboard-glass-card dashboard-card-padding">
      <p className="font-label-sm app-muted">{label}</p>
      <p className="mt-1 font-headline-section text-headline-section app-heading">
        {value != null && value !== '' ? `${value}${suffix}` : '—'}
      </p>
    </div>
  );
}

export function BulletList({ title, items = [], color = 'settings', icon = 'checklist' }) {
  if (!items.length) return null;

  return (
    <section className={accentCardClass}>
      <SectionHeading color={color} icon={icon} title={title} alignDescription={false} />
      <ul className="list-disc space-y-1 pl-5 font-body-md text-on-surface-variant">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

export function ReportSectionCard({ title, score, color, icon, children }) {
  return (
    <section className={`${accentCardClass} min-w-0`}>
      <div className="flex items-start justify-between gap-2">
        <SectionHeading color={color} icon={icon} title={title} alignDescription={false} />
        {score != null ? (
          <span className="shrink-0 rounded-full bg-secondary/10 px-2 py-0.5 font-label-md text-secondary">
            {score}/100
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
