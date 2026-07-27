import { useEffect, useMemo, useRef } from 'react';
import { motion, useSpring, useTransform } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { getScoreColor, getScoreTone } from '../utils/resumeEditorUtils';
import { cn } from '../../../lib/utils';

const GAUGE_SIZE = 160;
const STROKE = 12;
const RADIUS = (GAUGE_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function AtsScoreGauge({ jobMatchScore = 0, atsScore = 0 }) {
  const { t } = useTranslation('resumeScanner');
  const matchScore = Math.max(0, Math.min(100, Number(jobMatchScore) || 0));
  const parseScore = Math.max(0, Math.min(100, Number(atsScore) || 0));
  const tone = getScoreTone(matchScore);
  const strokeColor = getScoreColor(matchScore);
  const spring = useSpring(matchScore, { stiffness: 90, damping: 18 });
  const displayScore = useTransform(spring, (value) => Math.round(value));
  const prevScoreRef = useRef(matchScore);

  useEffect(() => {
    spring.set(matchScore);
    prevScoreRef.current = matchScore;
  }, [matchScore, spring]);

  const dashOffset = useMemo(() => CIRCUMFERENCE - (matchScore / 100) * CIRCUMFERENCE, [matchScore]);

  return (
    <div className="text-center">
      <p className="font-label-sm text-on-surface-variant mb-sm">
        {t('analysis.gauge.jobMatchLabel')}
      </p>

      <div className="relative mx-auto" style={{ width: GAUGE_SIZE, height: GAUGE_SIZE }}>
        <svg width={GAUGE_SIZE} height={GAUGE_SIZE} className="-rotate-90">
          <circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth={STROKE}
            className="text-surface-container-high"
          />
          <motion.circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={strokeColor}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={matchScore}
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              'font-display-lg text-display-lg leading-none',
              tone === 'good' && 'text-green-600',
              tone === 'fair' && 'text-amber-600',
              tone === 'poor' && 'text-error'
            )}
          >
            <motion.span>{displayScore}</motion.span>
          </motion.span>
          <span className="font-label-sm text-on-surface-variant mt-0.5">/ 100</span>
        </div>
      </div>

      <div className="mt-md space-y-1">
        <div className="flex items-center justify-between font-label-sm text-on-surface-variant">
          <span>{t('analysis.gauge.atsLabel')}</span>
          <span className="text-on-surface font-medium">{parseScore}</span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${parseScore}%` }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          />
        </div>
        <p className="font-body-sm text-on-surface-variant text-start">
          {t('analysis.gauge.atsHint')}
        </p>
      </div>
    </div>
  );
}
