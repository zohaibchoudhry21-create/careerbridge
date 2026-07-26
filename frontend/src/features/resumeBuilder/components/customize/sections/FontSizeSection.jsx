import { useTranslation } from 'react-i18next';
import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function FontSizeSection() {
  const { t } = useTranslation('resumeBuilder');
  const { customize, updateCustomize } = useCustomizeDispatch();

  const fontSizeOptions = [
    {
      value: 'small',
      label: t('customize.fontSize.small'),
      preview: <span className="text-xs font-semibold">Aa</span>,
    },
    {
      value: 'medium',
      label: t('customize.fontSize.medium'),
      preview: <span className="text-base font-semibold">Aa</span>,
    },
    {
      value: 'large',
      label: t('customize.fontSize.large'),
      preview: <span className="text-xl font-semibold">Aa</span>,
    },
  ];

  return (
    <CustomizeSectionCard
      title={t('customize.fontSize.title')}
      description={t('customize.fontSize.description')}
    >
      <CustomizeButtonGroup
        options={fontSizeOptions}
        value={customize.fontSize}
        onChange={(value) => updateCustomize('fontSize', value)}
      />
    </CustomizeSectionCard>
  );
}
