import { useTranslation } from 'react-i18next';
import { IMAGES } from '../../config/images';
import AnimatedContent from '../ui/AnimatedContent';
import SectionIcon from '../ui/SectionIcon';

const POINT_COLORS = ['success', 'scanner', 'resume'];

export default function SolutionSection() {
  const { t } = useTranslation('marketing');
  const points = t('solution.points', { returnObjects: true });

  return (
    <section
      id="templates"
      className="bg-surface-container-low border-y border-outline-variant/20 py-xl overflow-hidden"
    >
      <div className="page-container grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
        <AnimatedContent
          direction="horizontal"
          reverse
          distance={90}
          duration={1}
          ease="power3.out"
          threshold={0.15}
          className="lg:col-span-5"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-full">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
                {t('solution.badge')}
              </span>
            </div>
            <h2 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-on-surface">
              {t('solution.title')}
            </h2>
            <p className="font-body-lg text-body-lg text-on-surface-variant border-l-4 border-secondary pl-4">
              <span className="animated-underline">{t('solution.descriptionHighlight')}</span>{' '}
              {t('solution.descriptionBody')}
            </p>
            <ul className="space-y-4 pt-4">
              {POINT_COLORS.map((color, index) => {
                const point = points[index] || {};
                return (
                  <li key={color} className="flex items-start gap-3">
                    <SectionIcon color={color} icon="check_circle" size="sm" className="mt-1 shrink-0" />
                    <div>
                      <h4 className="font-label-md text-label-md text-on-surface">{point.title}</h4>
                      <p className="text-sm text-on-surface-variant">{point.description}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </AnimatedContent>

        <AnimatedContent
          direction="horizontal"
          distance={100}
          duration={1.1}
          ease="power3.out"
          threshold={0.15}
          delay={0.15}
          scale={0.95}
          className="lg:col-span-7"
        >
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-level-2 bg-surface">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform hover:scale-105 duration-700"
              style={{ backgroundImage: `url('${IMAGES.solution}')` }}
              role="img"
              aria-label={t('solution.mockupAriaLabel')}
            />
          </div>
        </AnimatedContent>
      </div>
    </section>
  );
}
