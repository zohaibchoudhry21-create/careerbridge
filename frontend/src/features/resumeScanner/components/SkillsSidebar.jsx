import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';
import { getSkillDisplayName } from '../utils/resumeEditorUtils';
import DualScoreHeader from './DualScoreHeader';

const TABS = ['skills', 'searchability', 'recruiterTips'];

function getPerSkillSuggestionCounts(skillId, suggestions = []) {
  const linked = suggestions.filter(
    (suggestion) =>
      suggestion.targetSkillId === skillId &&
      (suggestion.status === 'pending' || suggestion.status === 'accepted')
  );
  const accepted = linked.filter((suggestion) => suggestion.status === 'accepted').length;
  return { accepted, total: linked.length };
}

function sortMatchedFirst(skills = []) {
  return [...skills].sort((left, right) => Number(Boolean(right.matched)) - Number(Boolean(left.matched)));
}

function SkillRow({ skill, suggestions, t }) {
  const { accepted, total } = getPerSkillSuggestionCounts(skill.id, suggestions);
  const matched = Boolean(skill.matched);

  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 gap-2 min-w-0">
      <div className="flex items-center gap-3 min-w-0">
        <AppIcon
          name={matched ? 'check_circle' : 'cancel'}
          size="nav"
          className={cn('shrink-0', matched ? 'text-green-600' : 'text-red-500')}
          aria-hidden
        />
        <span className="text-sm text-slate-700 break-words">{getSkillDisplayName(skill)}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <AppIcon name="flag" size="sm" className="text-slate-300" aria-hidden />
        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded text-[10px] text-slate-400">
          <AppIcon name="sparkles" size="sm" className="text-blue-500" />
          <span>{t('analysis.skills.aiSuggestedPerSkill', { accepted, total })}</span>
        </div>
      </div>
    </div>
  );
}

function SkillCategorySection({
  title,
  infoLabel,
  skills,
  suggestions,
  showMissingCount = false,
  t,
}) {
  const orderedSkills = useMemo(() => sortMatchedFirst(skills), [skills]);
  const matchedCount = skills.filter((skill) => skill.matched).length;
  const missingCount = skills.length - matchedCount;

  return (
    <div>
      <div className="flex justify-between items-center mb-3 gap-2">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
          {title}
          <span title={infoLabel} aria-label={infoLabel} className="inline-flex">
            <AppIcon name="help" size="sm" className="text-slate-400" />
          </span>
        </h3>
        <div className="flex gap-2 text-[10px] text-slate-500 shrink-0">
          <span>
            {t('analysis.skills.matchedLabel')}{' '}
            <span className="bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">
              {matchedCount}
            </span>
          </span>
          {showMissingCount ? (
            <span>
              {t('analysis.skills.missingLabel')}{' '}
              <span className="text-red-600 font-bold">{missingCount}</span>
            </span>
          ) : null}
        </div>
      </div>
      <div className="space-y-1">
        {orderedSkills.length ? (
          orderedSkills.map((skill) => (
            <SkillRow key={skill.id} skill={skill} suggestions={suggestions} t={t} />
          ))
        ) : (
          <p className="text-sm text-slate-400 py-2">{t('analysis.skills.emptyCategory')}</p>
        )}
      </div>
    </div>
  );
}

function BreakdownBar({ label, value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-800 font-medium">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-blue-600"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}

export default function SkillsSidebar({ analysis, scoreDeltas = { ats: 0, job: 0 } }) {
  const { t } = useTranslation('resumeScanner');
  const [activeTab, setActiveTab] = useState('skills');

  const allSkills = analysis?.skills || [];
  const suggestions = analysis?.suggestions || [];
  const requiredSkills = useMemo(
    () => allSkills.filter((skill) => skill.type === 'required'),
    [allSkills]
  );
  const hardSkills = useMemo(
    () => allSkills.filter((skill) => skill.type === 'hard'),
    [allSkills]
  );

  const breakdown = analysis?.atsScoreBreakdown || {};
  const issues = analysis?.searchabilityIssues || [];
  const tips = analysis?.recruiterTips || [];
  const company = analysis?.jobDescription?.company || t('analysis.defaultJobTitle');
  const jobTitle = analysis?.jobDescription?.title || '';
  const warnings = analysis?.warnings || {};
  const jobMatchUnavailable = Boolean(
    analysis?.jobMatchUnavailable || warnings.jdRequirementsUnclear
  );
  const isRewritePending =
    analysis?.analysisMode === 'rewrite' && analysis?.rewriteStatus === 'pending_review';

  return (
    <aside className="h-full flex flex-col bg-white border-r border-slate-200 min-h-0">
      <div className="p-4 border-b border-slate-100 shrink-0">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-1 min-w-0 space-y-2">
            <DualScoreHeader
              atsScore={analysis?.atsScore}
              jobMatchScore={analysis?.jobMatchScore}
              atsScoreBreakdown={analysis?.atsScoreBreakdown}
              jobMatchBreakdown={analysis?.jobMatchBreakdown}
              scoreDeltas={scoreDeltas}
              jobMatchUnavailable={jobMatchUnavailable}
            />
            {isRewritePending ? (
              <div
                role="status"
                className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-2 text-[11px] text-blue-800 leading-snug"
              >
                {t('analysis.rewrite.bannerTitle')}
              </div>
            ) : null}
            {warnings.fieldMismatch && !jobMatchUnavailable && !isRewritePending ? (
              <div
                role="status"
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] text-amber-800 leading-snug"
              >
                {t('analysis.warnings.fieldMismatch')}
              </div>
            ) : null}
            {warnings.lowExtractionQuality ? (
              <div
                role="status"
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600 leading-snug"
              >
                {t('analysis.warnings.lowExtractionQuality')}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 truncate">{company}</h2>
            {jobTitle ? (
              <p className="text-slate-500 text-sm truncate">{jobTitle}</p>
            ) : null}
          </div>
          <span className="bg-amber-50 text-amber-600 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200 shrink-0">
            {t('analysis.atsTipBadge')}
          </span>
        </div>

        <div className="flex text-sm font-medium border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 transition-colors',
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              {t(`analysis.tabs.${tab}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'skills' ? (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-6"
            >
              <SkillCategorySection
                title={t('analysis.skills.requiredSkills')}
                infoLabel={t('analysis.skills.requiredInfo')}
                skills={requiredSkills}
                suggestions={suggestions}
                t={t}
              />
              <SkillCategorySection
                title={t('analysis.skills.hardSkills')}
                infoLabel={t('analysis.skills.hardInfo')}
                skills={hardSkills}
                suggestions={suggestions}
                showMissingCount
                t={t}
              />
            </motion.div>
          ) : null}

          {activeTab === 'searchability' ? (
            <motion.div
              key="searchability"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-4"
            >
              <div className="space-y-3">
                <BreakdownBar
                  label={t('analysis.searchability.sectionCompleteness')}
                  value={breakdown.sectionCompleteness}
                />
                <BreakdownBar
                  label={t('analysis.searchability.searchability')}
                  value={breakdown.searchability}
                />
                <BreakdownBar
                  label={t('analysis.searchability.quantifiedAchievements')}
                  value={breakdown.quantifiedAchievements}
                />
              </div>
              <section>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">
                  {t('analysis.searchability.issues')}
                </h3>
                {issues.length ? (
                  <ul className="space-y-2">
                    {issues.map((issue) => (
                      <li key={issue} className="text-sm text-slate-500 flex gap-2 items-start">
                        <AppIcon name="alert-circle" size="sm" className="text-amber-600 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400">{t('analysis.searchability.noIssues')}</p>
                )}
              </section>
            </motion.div>
          ) : null}

          {activeTab === 'recruiterTips' ? (
            <motion.div
              key="recruiterTips"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              {tips.length ? (
                <ul className="space-y-3">
                  {tips.map((tip) => (
                    <li key={tip} className="text-sm text-slate-500 flex gap-2 items-start">
                      <AppIcon name="lightbulb" size="sm" className="text-blue-600 mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">{t('analysis.recruiterTips.empty')}</p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </aside>
  );
}
