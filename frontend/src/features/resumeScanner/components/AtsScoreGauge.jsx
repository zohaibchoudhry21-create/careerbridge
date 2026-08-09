import { useEffect, useMemo } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { getScoreColor, getScoreTone } from '../utils/resumeEditorUtils';
import { cn } from '../../../lib/utils';

const SIZES = {
  sm: { gauge: 48, stroke: 3, radius: 20, font: 'text-lg' },
  md: { gauge: 56, stroke: 4, radius: 24, font: 'text-xl' },
};

/**
 * Circular score gauge bound to a single numeric score (0–100).
 */
export default function AtsScoreGauge({
  score = 0,
  size = 'md',
}) {
  const matchScore = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = getScoreTone(matchScore);
  const strokeColor = getScoreColor(matchScore);
  const spring = useSpring(matchScore, { stiffness: 90, damping: 18 });
  const displayScore = useTransform(spring, (value) => Math.round(value));

  const { gauge: GAUGE_SIZE, stroke: STROKE, radius: RADIUS, font: fontClass } = SIZES[size] || SIZES.md;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

  useEffect(() => {
    spring.set(matchScore);
  }, [matchScore, spring]);

  const dashOffset = useMemo(
    () => CIRCUMFERENCE - (matchScore / 100) * CIRCUMFERENCE,
    [matchScore, CIRCUMFERENCE]
  );

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}
      aria-label={`Score ${matchScore}`}
    >
      <svg
        width={GAUGE_SIZE}
        height={GAUGE_SIZE}
        viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={RADIUS}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-slate-100"
        />
        <motion.circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={RADIUS}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        />
      </svg>
      <motion.span
        className={cn(
          'absolute font-bold tabular-nums',
          fontClass,
          tone === 'good' && 'text-green-600',
          tone === 'fair' && 'text-amber-600',
          tone === 'poor' && 'text-red-600'
        )}
      >
        {displayScore}
      </motion.span>
    </div>
  );
}
