import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { buttonPrimaryClass, buttonSecondaryClass } from '../ui/buttonTokens';
import { cn } from '../../lib/utils';

export default function FinalCTA() {
  const { t } = useTranslation('marketing');

  return (
    <section className="py-xl text-center page-container-narrow reveal-zoom is-visible" id="resources">
      <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-6">
        {t('finalCta.title')}
      </h2>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">{t('finalCta.description')}</p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Link
          to="/register"
          className={cn(
            buttonPrimaryClass,
            'anim-bounce-loop w-full rounded-2xl px-8 py-4 text-lg text-white shadow-level-2 hover:text-white sm:w-auto'
          )}
        >
          {t('finalCta.primary')}
        </Link>
        <Link
          to="/resume/upload"
          className={cn(
            buttonSecondaryClass,
            'w-full rounded-2xl px-8 py-4 text-lg sm:w-auto'
          )}
        >
          {t('finalCta.secondary')}
        </Link>
      </div>
    </section>
  );
}
