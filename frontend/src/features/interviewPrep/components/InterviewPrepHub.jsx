import { Link } from 'react-router-dom';
import AppIcon from '../../../components/icons/AppIcon';
import SectionIcon from '../../../components/ui/SectionIcon';

const MODULES = [
  {
    id: 'mock-interview',
    title: 'AI Mock Interview',
    description: 'Live AI interview with real-time voice, camera feedback, and a combined report.',
    icon: 'mic_external_on',
    color: 'interview',
    to: '/interview-prep/mock',
    comingSoon: false,
  },
  {
    id: 'skill-assessment',
    title: 'Skill Assessment',
    description: 'Topic-based MCQ quiz with scoring and weak-area detection.',
    icon: 'school',
    color: 'skills',
    to: '/interview-prep/skills',
    comingSoon: false,
  },
];

export default function InterviewPrepHub() {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-sm md:grid-cols-2">
      {MODULES.map((module) => {
        const cardClass =
          'dashboard-glass-card dashboard-card-padding rounded-2xl min-h-[180px] flex flex-col gap-sm text-left w-full transition-all';

        const inner = (
          <>
            <div className="flex items-start justify-between gap-sm">
              <SectionIcon color={module.color} icon={module.icon} size="md" />
              {module.comingSoon ? (
                <span className="rounded-full bg-surface-container-high px-2 py-0.5 font-label-sm text-on-surface-variant">
                  Coming soon
                </span>
              ) : null}
            </div>
            <h2 className="font-headline-section text-headline-section text-on-surface">{module.title}</h2>
            <p className="flex-1 font-body-md text-on-surface-variant">{module.description}</p>
            {!module.comingSoon ? (
              <span className="inline-flex items-center gap-1 font-label-md text-secondary">
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
