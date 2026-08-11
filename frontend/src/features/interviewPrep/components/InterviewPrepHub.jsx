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

const CARD_BASE =
  'dashboard-card-hover app-surface-card group flex h-full w-full min-h-[180px] flex-col items-start p-sm text-start transition-all duration-200 sm:p-md';

const CARD_INTERACTIVE =
  `${CARD_BASE} hover:border-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40`;

export default function InterviewPrepHub() {
  const { t } = useTranslation('interviewPrep');

  return (
    <div className="grid min-w-0 grid-cols-1 gap-sm md:grid-cols-2">
      {MODULE_META.map((module) => {
        const inner = (
          <>
            <div className="flex w-full items-start justify-between gap-sm">
              <SectionIcon color={module.color} icon={module.icon} size="md" />
              {module.comingSoon ? (
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm app-muted">
                  {t('hub.comingSoon')}
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 font-headline-section text-headline-section app-heading">
              {t(module.titleKey)}
            </h2>
            <p className="mt-3 flex-1 font-body-md text-sm leading-relaxed app-muted">
              {t(module.descriptionKey)}
            </p>
            {!module.comingSoon ? (
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-label-md text-secondary opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                {t('hub.start')}
                <AppIcon name="chevron_right" size="button" className="rtl:rotate-180" />
              </span>
            ) : null}
          </>
        );

        if (module.to && !module.comingSoon) {
          return (
            <Link key={module.id} to={module.to} className={CARD_INTERACTIVE}>
              {inner}
            </Link>
          );
        }

        return (
          <div
            key={module.id}
            className={`${CARD_BASE} cursor-not-allowed opacity-80`}
            aria-disabled="true"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
