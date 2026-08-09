import { cn } from '../../../lib/utils';

/**
 * Live call countdown badge — MM:SS with urgency color states.
 */
export default function InterviewCountdownBadge({
  display = '00:00',
  urgency = 'idle',
  label,
  className,
}) {
  const tone =
    urgency === 'expired' || urgency === 'critical'
      ? 'bg-error-container text-on-error-container ring-1 ring-error/30'
      : urgency === 'warn'
        ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
        : 'bg-surface-container-high text-on-surface ring-1 ring-outline-variant/50';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-label-sm font-semibold tabular-nums',
        tone,
        className
      )}
      role="timer"
      aria-live="polite"
      aria-atomic="true"
      title={label}
    >
      {label ? <span className="font-medium opacity-80">{label}</span> : null}
      <span>{display}</span>
    </span>
  );
}
