import { useTranslation } from 'react-i18next';
import AnimatedContent from '../ui/AnimatedContent';
import SectionIcon from '../ui/SectionIcon';
import { Sparkles } from '../animate-ui/icons/sparkles';

const FEATURE_META = [
  { icon: 'document_scanner', color: 'scanner' },
  { icon: 'mic', color: 'mode' },
  { color: 'focus', AnimatedIcon: Sparkles },
  { icon: 'picture_as_pdf', color: 'resume' },
  { icon: 'work', color: 'role' },
  { icon: 'payments', color: 'time' },
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
      </AnimatedContent>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURE_META.map((meta, index) => {
          const feature = items[index] || {};
          const FeatureIcon = meta.AnimatedIcon;
          return (
            <AnimatedContent
              key={meta.icon || meta.color}
              distance={70}
              duration={0.85}
              ease="power3.out"
              threshold={0.1}
              delay={(index % 3) * 0.1}
              scale={0.96}
              className="h-full"
            >
              <div className="hover-lift group relative h-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm transition-all hover:border-secondary hover:shadow-[0_0_20px_rgba(33,112,228,0.2)]">
                <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-secondary/5 transition-transform group-hover:scale-110" />
                {FeatureIcon || meta.icon ? (
                  <div className="relative z-10 mb-4">
                    {FeatureIcon ? (
                      <SectionIcon color={meta.color} size="md">
                        <FeatureIcon size={20} animateOnHover />
                      </SectionIcon>
                    ) : (
                      <SectionIcon color={meta.color} icon={meta.icon} size="md" />
                    )}
                  </div>
                ) : null}
                <h3 className="relative z-10 mb-2 font-label-md text-label-md text-on-surface">
                  {feature.title}
                </h3>
                <p className="relative z-10 text-sm text-on-surface-variant">{feature.description}</p>
              </div>
            </AnimatedContent>
          );
        })}
      </div>
    </section>
  );
}
