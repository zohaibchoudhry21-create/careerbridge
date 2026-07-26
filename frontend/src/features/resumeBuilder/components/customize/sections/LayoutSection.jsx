import { useTranslation } from 'react-i18next';
import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function LayoutSection() {
  const { t } = useTranslation('resumeBuilder');
  const { customize, updateCustomize } = useCustomizeDispatch();

  const layoutOptions = [
    { value: 'single', label: t('customize.layout.singleColumn') },
    { value: 'two-column', label: t('customize.layout.twoColumn') },
  ];

  return (
    <CustomizeSectionCard
      title={t('customize.layout.title')}
      description={t('customize.layout.description')}
    >
      <CustomizeButtonGroup
        options={layoutOptions}
        value={customize.columns}
        onChange={(value) => updateCustomize('columns', value)}
      />
    </CustomizeSectionCard>
  );
}
