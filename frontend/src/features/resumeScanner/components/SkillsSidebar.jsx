import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';
import { getSkillDisplayName } from '../utils/resumeEditorUtils';
import AtsScoreGauge from './AtsScoreGauge';

const TABS = ['skills', 'searchability', 'recruiterTips'];

function SkillTag({ skill, variant }) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-sm',
        variant === 'matched' && 'bg-green-100 text-green-800',
        variant === 'missing' && 'bg-amber-50 text-amber-900 border border-amber-200'
      )}
    >
      {variant === 'matched' ? (
        <AppIcon name="check" size="sm" className="text-green-700" />
      ) : (
        <AppIcon name="alert-circle" size="sm" className="text-amber-700" />
      )}
      {getSkillDisplayName(skill)}
    </motion.span>
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

  const matchedSkills = analysis?.matchedSkills || [];
  const missingSkills = analysis?.missingSkills || [];
  const hardSkills = (analysis?.skills || []).filter((skill) => skill.type === 'hard');
  const requiredSkills = (analysis?.skills || []).filter(
    (skill) => skill.type === 'required' || skill.type === 'soft'
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
              <section>
                <h3 className="font-label-md text-on-surface mb-sm">
                  {t('analysis.skills.matched')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {matchedSkills.length ? (
                    matchedSkills.map((skill) => (
                      <SkillTag key={skill.id} skill={skill} variant="matched" />
                    ))
                  ) : (
                    <p className="font-body-sm text-on-surface-variant">
                      {t('analysis.skills.noMatched')}
                    </p>
                  )}
                </div>
              </section>

              <section>
                <h3 className="font-label-md text-on-surface mb-sm">
                  {t('analysis.skills.missing')}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {missingSkills.length ? (
                    missingSkills.map((skill) => (
                      <SkillTag key={skill.id} skill={skill} variant="missing" />
                    ))
                  ) : (
                    <p className="font-body-sm text-on-surface-variant">
                      {t('analysis.skills.noMissing')}
                    </p>
                  )}
                </div>
              </section>

              {hardSkills.length ? (
                <section>
                  <h3 className="font-label-md text-on-surface mb-sm">
                    {t('analysis.skills.hardSkills')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {hardSkills.map((skill) => (
                      <SkillTag
                        key={skill.id}
                        skill={skill}
                        variant={skill.matched ? 'matched' : 'missing'}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {requiredSkills.length ? (
                <section>
                  <h3 className="font-label-md text-on-surface mb-sm">
                    {t('analysis.skills.requiredSkills')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((skill) => (
                      <SkillTag
                        key={skill.id}
                        skill={skill}
                        variant={skill.matched ? 'matched' : 'missing'}
                      />
                    ))}
                  </div>
                </section>
              ) : null}
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
