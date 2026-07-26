import { useTranslation } from 'react-i18next';
import CustomizeSectionCard from '../CustomizeSectionCard';
import CustomizeToggle from '../CustomizeToggle';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function HeaderSection() {
  const { t } = useTranslation('resumeBuilder');
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard
      title={t('customize.header.title')}
      description={t('customize.header.description')}
    >
      <CustomizeToggle
        label={t('customize.header.showPhoto')}
        description={t('customize.header.showPhotoHint')}
        checked={customize.showPhoto}
        onChange={(value) => updateCustomize('showPhoto', value)}
      />
    </CustomizeSectionCard>
  );
}
