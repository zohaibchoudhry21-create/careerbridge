import { useTranslation } from 'react-i18next';
import CustomizeSectionCard from '../CustomizeSectionCard';
import CustomizeToggle from '../CustomizeToggle';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function FooterSection() {
  const { t } = useTranslation('resumeBuilder');
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard
      title={t('customize.footer.title')}
      description={t('customize.footer.description')}
    >
      <CustomizeToggle
        label={t('customize.footer.showPageNumbers')}
        checked={customize.showPageNumbers}
        onChange={(value) => updateCustomize('showPageNumbers', value)}
      />
    </CustomizeSectionCard>
  );
}
