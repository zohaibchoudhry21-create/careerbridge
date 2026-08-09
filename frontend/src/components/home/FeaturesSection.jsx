import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnimatedContent from '../ui/AnimatedContent';
import SectionIcon from '../ui/SectionIcon';
import AppIcon from '../icons/AppIcon';

const FEATURE_META = [
  { icon: 'description', color: 'resume', href: '/resume/upload' },
  { icon: 'document_scanner', color: 'scanner', href: '/resume-scanner' },
  { icon: 'mic', color: 'interview', href: '/interview-prep' },
];

export default function FeaturesSection() {
  const { t } = useTranslation('marketing');
  const items = t('features.items', { returnObjects: true });

  return (
    <section className="page-container py-xl" id="features">
      <AnimatedContent
        distance={60}
        duration={0.9}
        ease="power3.out"
        threshold={0.15}
        className="mb-lg text-center"
      >
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface md:font-headline-lg md:text-headline-lg">
          {t('features.title')}
        </h2>
        <p className="mx-auto mt-2 max-w-2xl font-body-md text-body-md text-on-surface-variant">
          {t('features.subtitle')}
        </p>
      </AnimatedContent>

      <div className="grid grid-cols-1 gap-md md:grid-cols-3">
        {(Array.isArray(items) ? items : []).map((feature, index) => {
          const meta = FEATURE_META[index] || FEATURE_META[0];
          return (
            <AnimatedContent
              key={meta.icon}
              distance={70}
              duration={0.85}
              ease="power3.out"
              threshold={0.1}
              delay={index * 0.1}
              scale={0.96}
              className="h-full"
            >
              <Link
                to={meta.href}
                className="flex h-full min-h-[280px] flex-col items-center justify-center space-y-5 rounded-[2rem] border border-outline-variant/50 bg-white px-6 py-10 text-center shadow-sm transition-all hover:-translate-y-2 hover:border-secondary hover:shadow-level-2 md:min-h-[300px]"
              >
                <SectionIcon
                  color={meta.color}
                  size="lg"
                  className="mb-1 h-16 w-16 rounded-full"
                >
                  <AppIcon name={meta.icon} size="settings" />
                </SectionIcon>
                <h3 className="font-headline-md text-headline-md text-on-surface">
                  {feature.title}
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  {feature.description}
                </p>
              </Link>
            </AnimatedContent>
          );
        })}
      </div>
    </section>
  );
}
