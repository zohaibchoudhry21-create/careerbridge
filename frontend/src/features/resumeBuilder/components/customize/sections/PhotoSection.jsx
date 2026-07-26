import { useTranslation } from 'react-i18next';
import AppIcon from '../../../../../components/icons/AppIcon';
import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function PhotoSection() {
  const { t } = useTranslation('resumeBuilder');
  const { customize, updateCustomize } = useCustomizeDispatch();

  const photoShapeOptions = [
    {
      value: 'circle',
      label: t('customize.photo.circle'),
      preview: <AppIcon name="account_circle" size="h-[22px] w-[22px]" />,
    },
    {
      value: 'square',
      label: t('customize.photo.square'),
      preview: <AppIcon name="crop_square" size="h-[22px] w-[22px]" />,
    },
  ];

  return (
    <div className={customize.showPhoto ? '' : 'opacity-50 pointer-events-none'}>
      <CustomizeSectionCard
        title={t('customize.photo.title')}
        description={
          customize.showPhoto
            ? t('customize.photo.descriptionEnabled')
            : t('customize.photo.descriptionDisabled')
        }
      >
        <CustomizeButtonGroup
          options={photoShapeOptions}
          value={customize.photoShape}
          onChange={(value) => updateCustomize('photoShape', value)}
        />
      </CustomizeSectionCard>
    </div>
  );
}
