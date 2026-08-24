import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import AppIcon from '../../../../components/icons/AppIcon';
import Button from '../../../../components/ui/Button';
import SectionHeading from '../../../../components/ui/SectionHeading';
import { accentCardClass } from '../../../../components/ui/colorAccentTokens';
import { FOCUS_AREA_I18N_KEYS } from '../../constants/interviewPrepConstants';
import {
  loadInterviewSetupPrefs,
  saveInterviewSetupPrefs,
} from '../../utils/interviewSetupPrefs';
import {
  focusAreasFromWeakDimensions,
  getScoreBand,
  pickWeakestDimensions,
} from '../../utils/reportInsights';

const SETUP_ROUTE = '/interview-prep/mock';

/**
 * Closes the loop: the weakest dimensions from this report seed the focus areas
 * of the next setup, so feedback turns into the next practice session.
 */
export default function NextStepsCard({ dimensions }) {
  const { t } = useTranslation('interviewPrep');
  const navigate = useNavigate();

  const weakest = pickWeakestDimensions(dimensions, 3);
  const focusAreas = focusAreasFromWeakDimensions(dimensions, 3);

  const handlePracticeWeakAreas = () => {
    const prefs = loadInterviewSetupPrefs() || {};
    saveInterviewSetupPrefs({ ...prefs, focusAreas });
    toast.success(t('report.nextSteps.prefilled'));
    navigate(SETUP_ROUTE);
  };

  return (
    <section className={accentCardClass}>
      <SectionHeading
        color="focus"
        icon="target"
        title={t('report.nextSteps.title')}
        description={t('report.nextSteps.description')}
        alignDescription={false}
      />

      {weakest.length ? (
        <div>
          <p className="font-label-sm app-muted">{t('report.nextSteps.weakestAreas')}</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {weakest.map((item) => {
              const band = getScoreBand(item.score);
              return (
                <span
                  key={item.key}
                  className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-low px-2.5 py-1 font-label-sm text-on-surface"
                >
                  {item.label || t(`report.enterprise.dimensions.${item.key}`, item.key)}
                  <span className={band?.text || 'text-secondary'}>{item.score}</span>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {focusAreas.length ? (
          <Button
            type="button"
            variant="gradient"
            onClick={handlePracticeWeakAreas}
            className="gap-2 !rounded-xl !py-2.5"
          >
            <AppIcon name="sparkles" size="sm" className="text-white" />
            {t('report.nextSteps.practiceWeakAreas')}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigate(SETUP_ROUTE)}
          className="gap-2 px-4 py-2.5"
        >
          <AppIcon name="mic" size="sm" />
          {t('report.nextSteps.newInterview')}
        </Button>
      </div>

      {focusAreas.length ? (
        <p className="font-label-sm app-muted">
          {focusAreas
            .map((area) => {
              const key = FOCUS_AREA_I18N_KEYS[area];
              return key ? t(`focusAreas.${key}`) : area;
            })
            .join(' · ')}
        </p>
      ) : null}
    </section>
  );
}
