import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Button from '../ui/Button';

export default function FinalCTA() {
  const { t } = useTranslation('marketing');

  return (
    <section className="py-xl text-center page-container-narrow reveal-zoom is-visible" id="resources">
      <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-on-surface mb-6">
        {t('finalCta.title')}
      </h2>
      <p className="font-body-lg text-body-lg text-on-surface-variant mb-8">{t('finalCta.description')}</p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
        <Button
          as={Link}
          to="/register"
          variant="primary"
          className="anim-bounce-loop w-full rounded-2xl px-8 py-4 text-lg shadow-level-2 sm:w-auto"
        >
          {t('finalCta.primary')}
        </Button>
        <Button
          as={Link}
          to="/register"
          variant="secondary"
          className="w-full rounded-2xl px-8 py-4 text-lg sm:w-auto"
        >
          {t('finalCta.secondary')}
        </Button>
      </div>
    </section>
  );
}
