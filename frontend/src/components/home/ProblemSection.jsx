import { useTranslation } from 'react-i18next';
import AnimatedContent from '../ui/AnimatedContent';
import SectionIcon from '../ui/SectionIcon';

const PROBLEM_META = [
  {
    icon: 'filter_alt_off',
    color: 'danger',
    cardClass: 'bg-error-container/20 border border-error-container',
    iconAnimationClass: 'anim-pulse-red',
  },
  {
    icon: 'difference',
    color: 'warning',
    cardClass: 'bg-surface-container-high border border-outline-variant/50',
    iconAnimationClass: 'anim-pulse-red [animation-delay:0.5s]',
  },
  {
    icon: 'psychology_alt',
    color: 'interview',
    cardClass: 'bg-surface-container-high border border-outline-variant/50',
    iconAnimationClass: 'anim-pulse-red [animation-delay:1s]',
  },
];

export default function ProblemSection() {
  const { t } = useTranslation('marketing');
  const items = t('problem.items', { returnObjects: true });

  return (
    <section className="page-container py-xl" id="problem">
      <AnimatedContent
        distance={70}
        duration={0.9}
        ease="power3.out"
        threshold={0.15}
        className="mx-auto mb-lg max-w-2xl space-y-4 text-center"
      >
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
          {t('problem.title')}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant">{t('problem.subtitle')}</p>
      </AnimatedContent>

      <div className="grid grid-cols-1 gap-md md:grid-cols-3">
        {PROBLEM_META.map((meta, index) => {
          const item = items[index] || {};
          return (
            <AnimatedContent
              key={meta.icon}
              distance={80}
              duration={0.85}
              ease="power3.out"
              threshold={0.12}
              delay={index * 0.12}
              className="h-full"
            >
              <div
                className={`${meta.cardClass} flex h-full flex-col items-center space-y-4 rounded-2xl p-6 text-center transition-all hover:-translate-y-2 hover:shadow-level-2`}
              >
                <SectionIcon
                  color={meta.color}
                  icon={meta.icon}
                  size="lg"
                  className={`mb-2 ${meta.iconAnimationClass}`}
                />
                <h3 className="font-headline-md text-headline-md text-on-surface">{item.title}</h3>
                <p className="font-body-md text-body-md text-on-surface-variant">{item.description}</p>
              </div>
            </AnimatedContent>
          );
        })}
      </div>
    </section>
  );
}
