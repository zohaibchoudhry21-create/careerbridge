import AnimatedContent from '../ui/AnimatedContent';
import SectionIcon from '../ui/SectionIcon';

const problems = [
  {
    icon: 'filter_alt_off',
    color: 'danger',
    title: 'ATS Rejection',
    description:
      'Over 75% of CVs are rejected by Applicant Tracking Systems before a human ever sees them due to poor formatting.',
    cardClass: 'bg-error-container/20 border border-error-container',
    iconAnimationClass: 'anim-pulse-red',
  },
  {
    icon: 'difference',
    color: 'warning',
    title: 'Generic Resumes',
    description:
      'Sending the exact same resume to every job description drastically lowers your callback rate.',
    cardClass: 'bg-surface-container-high border border-outline-variant/50',
    iconAnimationClass: 'anim-pulse-red [animation-delay:0.5s]',
  },
  {
    icon: 'psychology_alt',
    color: 'interview',
    title: 'Weak Prep',
    description:
      'Even if you pass the screen, lacking tailored interview preparation tailored to the specific role leads to failure.',
    cardClass: 'bg-surface-container-high border border-outline-variant/50',
    iconAnimationClass: 'anim-pulse-red [animation-delay:1s]',
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
        className="mx-auto mb-lg max-w-2xl space-y-4 text-center"
      >
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
          Why do most candidates fail in the hiring process?
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">
          The modern job search is broken. Without the right tools, great candidates slip through
          the cracks of automated systems.
        </p>
      </AnimatedContent>

      <div className="grid grid-cols-1 gap-md md:grid-cols-3">
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
              className={`${item.cardClass} flex h-full flex-col items-center space-y-4 rounded-2xl p-6 text-center transition-all hover:-translate-y-2 hover:shadow-level-2`}
            >
              <SectionIcon
                color={item.color}
                icon={item.icon}
                size="lg"
                className={`mb-2 ${item.iconAnimationClass}`}
              />
              <h3 className="font-headline-md text-headline-md text-on-surface">{item.title}</h3>
              <p className="font-body-md text-body-md text-on-surface-variant">{item.description}</p>
            </div>
          </AnimatedContent>
        ))}
      </div>
    </section>
  );
}
