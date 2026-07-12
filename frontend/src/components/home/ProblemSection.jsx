import AnimatedContent from '../ui/AnimatedContent';
import AppIcon from '../icons/AppIcon';

const problems = [
  {
    icon: 'filter_alt_off',
    title: 'ATS Rejection',
    description:
      'Over 75% of CVs are rejected by Applicant Tracking Systems before a human ever sees them due to poor formatting.',
    cardClass: 'bg-error-container/20 border border-error-container',
    iconClass: 'bg-error-container text-error anim-pulse-red',
  },
  {
    icon: 'difference',
    title: 'Generic Resumes',
    description:
      'Sending the exact same resume to every job description drastically lowers your callback rate.',
    cardClass: 'bg-surface-container-high border border-outline-variant/50',
    iconClass: 'bg-surface-variant text-on-surface-variant anim-pulse-red',
    animationDelay: '0.5s',
  },
  {
    icon: 'psychology_alt',
    title: 'Weak Prep',
    description:
      'Even if you pass the screen, lacking tailored interview preparation tailored to the specific role leads to failure.',
    cardClass: 'bg-surface-container-high border border-outline-variant/50',
    iconClass: 'bg-surface-variant text-on-surface-variant anim-pulse-red',
    animationDelay: '1s',
  },
];

export default function ProblemSection() {
  return (
    <section className="page-container py-xl">
      <AnimatedContent
        distance={70}
        duration={0.9}
        ease="power3.out"
        threshold={0.15}
        className="text-center mb-lg space-y-4 max-w-2xl mx-auto"
      >
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
          Why do most candidates fail in the hiring process?
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          The modern job search is broken. Without the right tools, great candidates slip through
          the cracks of automated systems.
        </p>
      </AnimatedContent>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {problems.map((item, index) => (
          <AnimatedContent
            key={item.title}
            distance={80}
            duration={0.85}
            ease="power3.out"
            threshold={0.12}
            delay={index * 0.12}
            className="h-full"
          >
            <div
              className={`${item.cardClass} p-6 rounded-2xl flex flex-col items-center text-center space-y-4 hover:shadow-level-2 hover:-translate-y-2 transition-all h-full`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${item.iconClass}`}
                style={item.animationDelay ? { animationDelay: item.animationDelay } : undefined}
              >
                <AppIcon name={item.icon} size="h-8 w-8" />
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface">{item.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{item.description}</p>
            </div>
          </AnimatedContent>
        ))}
      </div>
    </section>
  );
}
