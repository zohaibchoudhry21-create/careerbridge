import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import SectionIcon from '../../../components/ui/SectionIcon';

const MODULE_META = [
  {
    id: 'mock-interview',
    icon: 'mic_external_on',
    color: 'interview',
    to: '/interview-prep/mock',
    comingSoon: false,
    titleKey: 'hub.mockInterview.title',
    descriptionKey: 'hub.mockInterview.description',
  },
  {
    id: 'skill-assessment',
    icon: 'school',
    color: 'skills',
    to: '/interview-prep/skills',
    comingSoon: false,
    titleKey: 'hub.skillAssessment.title',
    descriptionKey: 'hub.skillAssessment.description',
  },
];

export default function InterviewPrepHub() {
  const { t } = useTranslation('interviewPrep');

  return (
    <div className="grid min-w-0 grid-cols-1 gap-sm md:grid-cols-2">
      {MODULE_META.map((module) => {
        const cardClass =
          'dashboard-glass-card dashboard-card-padding rounded-2xl min-h-[180px] flex flex-col gap-sm text-left w-full transition-all';

        const inner = (
          <>
            <div className="flex items-start justify-between gap-sm">
              <SectionIcon color={module.color} icon={module.icon} size="md" />
              {module.comingSoon ? (
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-on-surface-variant">
                  {t('hub.comingSoon')}
                </span>
              ) : null}
            </div>
            <h2 className="font-headline-section text-headline-section text-on-surface">
              {t(module.titleKey)}
            </h2>
            <p className="flex-1 font-body-md text-on-surface-variant">{t(module.descriptionKey)}</p>
            {!module.comingSoon ? (
              <span className="inline-flex items-center gap-1 font-label-md text-secondary">
                {t('hub.start')}
                <AppIcon name="chevron_right" size="sm" />
              </span>
            ) : null}
          </>
        );

        if (module.to && !module.comingSoon) {
          return (
            <Link key={module.id} to={module.to} className={`${cardClass} dashboard-card-hover`}>
              {inner}
            </Link>
          );
        }

        return (
          <div
            key={module.id}
            className={`${cardClass} cursor-not-allowed opacity-80`}
            aria-disabled="true"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
