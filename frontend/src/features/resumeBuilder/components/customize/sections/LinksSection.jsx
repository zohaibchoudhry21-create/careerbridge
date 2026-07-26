import { useTranslation } from 'react-i18next';
import CustomizeSectionCard from '../CustomizeSectionCard';

export default function LinksSection({ onGoToPersonalDetails }) {
  const { t } = useTranslation('resumeBuilder');

  return (
    <CustomizeSectionCard
      title={t('customize.links.title')}
      description={t('customize.links.description')}
    >
      <p className="text-on-surface-variant text-sm font-body-sm">
        {t('customize.links.managedInPersonalDetails')}
      </p>
      <button
        type="button"
        onClick={onGoToPersonalDetails}
        className="rounded-lg bg-secondary px-md py-sm font-label-md text-on-secondary hover:bg-secondary-container transition-colors"
      >
        {t('customize.links.goToPersonalDetails')}
      </button>
    </CustomizeSectionCard>
  );
}
