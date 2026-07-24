import { Link } from 'react-router-dom';
import AppIcon from '../../../components/icons/AppIcon';

const MODULES = [
  {
    id: 'mock-interview',
    title: 'AI Mock Interview',
    description: 'Live AI interview with real-time voice, camera feedback, and a combined report.',
    icon: 'mic_external_on',
    to: '/interview-prep/mock',
    comingSoon: false,
  },
  {
    id: 'skill-assessment',
    title: 'Skill Assessment',
    description: 'Topic-based MCQ quiz with scoring and weak-area detection.',
    icon: 'school',
    to: '/interview-prep/skills',
    comingSoon: false,
  },
];

export default function InterviewPrepHub() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-sm min-w-0">
      {MODULES.map((module) => {
        const cardClass =
          'dashboard-glass-card dashboard-card-padding rounded-2xl min-h-[180px] flex flex-col gap-sm text-left w-full transition-all';

        const inner = (
          <>
            <div className="flex items-start justify-between gap-sm">
              <AppIcon name={module.icon} size="dashboard" className="text-secondary shrink-0" />
              {module.comingSoon ? (
                <span className="font-label-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                  Coming soon
                </span>
              ) : null}
            </div>
            <h2 className="font-headline-section text-headline-section text-on-surface">{module.title}</h2>
            <p className="font-body-md text-on-surface-variant flex-1">{module.description}</p>
            {!module.comingSoon ? (
              <span className="font-label-md text-secondary inline-flex items-center gap-1">
                Start
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
            className={`${cardClass} opacity-80 cursor-not-allowed`}
            aria-disabled="true"
          >
            {inner}
          </div>
        );
      })}
    </div>
  );
}
