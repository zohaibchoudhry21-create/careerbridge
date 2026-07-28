import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';
import { getSkillDisplayName } from '../utils/resumeEditorUtils';
import AtsScoreGauge from './AtsScoreGauge';

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
    <div className="flex items-center gap-3 py-2.5 min-w-0">
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white',
          matched ? 'bg-green-500' : 'bg-red-500'
        )}
        aria-hidden
      >
        <AppIcon name={matched ? 'check' : 'close'} size="sm" className="text-white" />
      </span>

      <div className="min-w-0 flex-1 flex items-center gap-2">
        <p className="font-body-md text-on-surface leading-snug break-words">
          {getSkillDisplayName(skill)}
        </p>
        <AppIcon name="flag" size="sm" className="text-outline/70 shrink-0" aria-hidden />
      </div>

      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 font-label-sm text-secondary shrink-0">
        <AppIcon name="sparkles" size="sm" className="text-secondary" />
        {t('analysis.skills.aiSuggestedPerSkill', { accepted, total })}
      </span>
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
    <section>
      <div className="mb-1 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant">
            {title}
          </h3>
          <span className="inline-flex text-outline shrink-0" title={infoLabel} aria-label={infoLabel}>
            <AppIcon name="help" size="sm" />
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 font-label-sm shrink-0">
          <span className="text-on-surface-variant inline-flex items-center gap-1">
            {t('analysis.skills.matchedLabel')}
            <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-green-100 px-1.5 py-0.5 font-medium text-green-700">
              {matchedCount}
            </span>
          </span>
          {showMissingCount ? (
            <span className="text-on-surface-variant inline-flex items-center gap-1">
              {t('analysis.skills.missingLabel')}
              <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-md bg-error-container px-1.5 py-0.5 font-medium text-error">
                {missingCount}
              </span>
            </span>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-outline-variant/30">
        {orderedSkills.length ? (
          orderedSkills.map((skill) => (
            <SkillRow key={skill.id} skill={skill} suggestions={suggestions} t={t} />
          ))
        ) : (
          <p className="font-body-sm text-on-surface-variant py-2">{t('analysis.skills.emptyCategory')}</p>
        )}
      </div>
    </section>
  );
}

function BreakdownBar({ label, value }) {
  const score = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between font-label-sm">
        <span className="text-on-surface-variant">{label}</span>
        <span className="text-on-surface">{score}%</span>
      </div>
      <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-secondary"
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        />
      </div>
    </div>
  );
}

export default function SkillsSidebar({ analysis }) {
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

  return (
    <aside className="dashboard-glass-card rounded-2xl p-md flex flex-col gap-md min-h-0 lg:sticky lg:top-4">
      <AtsScoreGauge
        jobMatchScore={analysis?.jobMatchScore}
        atsScore={analysis?.atsScore}
      />

      <div className="border-b border-outline-variant/40 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 font-label-sm border-b-2 transition-colors',
              activeTab === tab
                ? 'border-secondary text-secondary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            {t(`analysis.tabs.${tab}`)}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'skills' ? (
            <motion.div
              key="skills"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-md"
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
              className="space-y-md"
            >
              <div className="space-y-sm">
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
                <h3 className="font-label-md text-on-surface mb-sm">
                  {t('analysis.searchability.issues')}
                </h3>
                {issues.length ? (
                  <ul className="space-y-2">
                    {issues.map((issue) => (
                      <li
                        key={issue}
                        className="font-body-sm text-on-surface-variant flex gap-2 items-start"
                      >
                        <AppIcon name="alert-circle" size="sm" className="text-amber-600 mt-0.5" />
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body-sm text-on-surface-variant">
                    {t('analysis.searchability.noIssues')}
                  </p>
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
              className="space-y-sm"
            >
              {tips.length ? (
                <ul className="space-y-3">
                  {tips.map((tip) => (
                    <li
                      key={tip}
                      className="font-body-sm text-on-surface-variant flex gap-2 items-start"
                    >
                      <AppIcon name="lightbulb" size="sm" className="text-secondary mt-0.5" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-body-sm text-on-surface-variant">
                  {t('analysis.recruiterTips.empty')}
                </p>
              )}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </aside>
  );
}
