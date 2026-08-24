import { cn } from '../../../../lib/utils';
import { getScoreBand } from '../../utils/reportInsights';
import { DeltaChip } from './ReportShared';

export default function ScoreRing({
  score = 0,
  size = 160,
  overallLabel,
  bandLabel,
  delta = null,
  deltaLabel,
}) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, Number(score) || 0));
  const offset = circumference - (clamped / 100) * circumference;
  const band = getScoreBand(clamped);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative inline-flex items-center justify-center"
        style={{ width: size, height: size }}
        role="img"
        aria-label={[overallLabel, `${clamped}/100`, bandLabel].filter(Boolean).join(' — ')}
      >
        <svg width={size} height={size} className="-rotate-90" aria-hidden>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-surface-container-high"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn('transition-all duration-700', band?.ring || 'text-secondary')}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'font-headline-dashboard text-headline-dashboard',
              band?.text || 'app-heading'
            )}
          >
            {clamped}
          </span>
          <span className="font-label-sm app-muted">{overallLabel}</span>
        </div>
      </div>

      {bandLabel || delta != null ? (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {bandLabel ? (
            <span className={cn('font-label-md font-semibold', band?.text || 'text-secondary')}>
              {bandLabel}
            </span>
          ) : null}
          <DeltaChip delta={delta} label={deltaLabel} />
        </div>
      ) : null}
    </div>
  );
}
