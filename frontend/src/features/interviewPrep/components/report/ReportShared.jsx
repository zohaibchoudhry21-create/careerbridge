import AppIcon from '../../../../components/icons/AppIcon';
import SectionHeading from '../../../../components/ui/SectionHeading';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import { cn } from '../../../../lib/utils';
import { TONE_TEXT_CLASSES } from '../../utils/reportInsights';

/** Attempt-over-attempt change. Renders nothing without a usable delta. */
export function DeltaChip({ delta, label, className }) {
  const value = Number(delta);
  if (delta == null || !Number.isFinite(value) || value === 0) return null;

  const positive = value > 0;

  return (
    <span
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 font-label-sm font-semibold',
        positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
        className
      )}
    >
      <AppIcon
        name={positive ? 'trending_up' : 'trending_down'}
        size="sm"
        className={positive ? 'text-emerald-600' : 'text-rose-600'}
      />
      {positive ? `+${value}` : value}
    </span>
  );
}

export function MetricTile({ label, value, suffix = '', hint, tone, delta, deltaLabel }) {
  return (
    <div className="min-w-0 rounded-2xl text-center dashboard-glass-card dashboard-card-padding">
      <p className="font-label-sm app-muted">{label}</p>
      <p
        className={cn(
          'mt-1 font-headline-section text-headline-section',
          tone ? TONE_TEXT_CLASSES[tone] : 'app-heading'
        )}
      >
        {value != null && value !== '' ? `${value}${suffix}` : '—'}
      </p>
      {delta != null ? (
        <div className="mt-1 flex justify-center">
          <DeltaChip delta={delta} label={deltaLabel} />
        </div>
      ) : null}
      {hint ? <p className="mt-1 font-label-sm app-muted">{hint}</p> : null}
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

export function ReportSectionCard({
  title,
  score,
  color,
  icon,
  delta,
  deltaLabel,
  children,
}) {
  return (
    <section className={`${accentCardClass} min-w-0`}>
      <div className="flex items-start justify-between gap-2">
        <SectionHeading color={color} icon={icon} title={title} alignDescription={false} />
        {score != null ? (
          <span className="flex shrink-0 items-center gap-1.5">
            <DeltaChip delta={delta} label={deltaLabel} />
            <span className="rounded-full bg-secondary/10 px-2 py-0.5 font-label-md text-secondary">
              {score}/100
            </span>
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
