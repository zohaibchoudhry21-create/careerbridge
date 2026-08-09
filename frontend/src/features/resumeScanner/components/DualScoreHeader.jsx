import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import AtsScoreGauge from './AtsScoreGauge';
import { cn } from '../../../lib/utils';

function BreakdownTooltip({ title, items }) {
  const [open, setOpen] = useState(false);

  if (!items?.length) return null;

  return (
    <div className="relative">
      <button
        type="button"
        className="text-[10px] text-slate-400 hover:text-blue-600 underline-offset-2 hover:underline"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      >
        {title}
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="absolute left-0 top-full z-20 mt-1 w-48 rounded-lg border border-slate-200 bg-white p-2 shadow-lg text-[10px] space-y-1"
          >
            {items.map((item) => (
              <div key={item.label} className="flex justify-between gap-2">
                <span className="text-slate-500 truncate">{item.label}</span>
                <span className="font-semibold text-slate-800 shrink-0">{item.value}%</span>
              </div>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ScoreDelta({ delta }) {
  if (delta == null || delta === 0) return null;
  const positive = delta > 0;
  return (
    <span
      className={cn(
        'text-[10px] font-bold px-1.5 py-0.5 rounded',
        positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      )}
    >
      {positive ? `+${delta}` : delta}
    </span>
  );
}

export default function DualScoreHeader({
  atsScore = 0,
  jobMatchScore = 0,
  atsScoreBreakdown = {},
  jobMatchBreakdown = {},
  scoreDeltas = { ats: 0, job: 0 },
  jobMatchUnavailable = false,
}) {
  const { t } = useTranslation('resumeScanner');

  const atsItems = [
    { label: t('analysis.searchability.sectionCompleteness'), value: atsScoreBreakdown.sectionCompleteness ?? 0 },
    { label: t('analysis.searchability.searchability'), value: atsScoreBreakdown.searchability ?? 0 },
    { label: t('analysis.searchability.quantifiedAchievements'), value: atsScoreBreakdown.quantifiedAchievements ?? 0 },
  ];

  const jobItems = [
    { label: t('analysis.jobMatch.keywordCoverage'), value: jobMatchBreakdown.keywordCoverage ?? 0 },
    { label: t('analysis.jobMatch.aiRelevance'), value: jobMatchBreakdown.aiAssessedRelevance ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <AtsScoreGauge score={atsScore} size="sm" />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] font-semibold text-slate-600 truncate">
              {t('analysis.gauge.atsLabel')}
            </p>
            <ScoreDelta delta={scoreDeltas.ats} />
          </div>
          <BreakdownTooltip title={t('analysis.gauge.viewBreakdown')} items={atsItems} />
        </div>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        {jobMatchUnavailable ? (
          <div className="min-w-0 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5">
            <p className="text-[11px] font-semibold text-amber-800">
              {t('analysis.gauge.jobMatchLabel')}
            </p>
            <p className="text-[10px] text-amber-700 leading-snug mt-0.5">
              {t('analysis.warnings.jdRequirementsUnclear')}
            </p>
          </div>
        ) : (
          <>
            <AtsScoreGauge score={jobMatchScore ?? 0} size="sm" />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[11px] font-semibold text-slate-600 truncate">
                  {t('analysis.gauge.jobMatchLabel')}
                </p>
                <ScoreDelta delta={scoreDeltas.job} />
              </div>
              <BreakdownTooltip title={t('analysis.gauge.viewBreakdown')} items={jobItems} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
