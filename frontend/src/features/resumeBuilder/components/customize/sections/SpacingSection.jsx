import { useTranslation } from 'react-i18next';
import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function SpacingSection() {
  const { t } = useTranslation('resumeBuilder');
  const { customize, updateCustomize } = useCustomizeDispatch();

  const lineHeightOptions = [
    { value: 'compact', label: t('customize.spacing.compact') },
    { value: 'normal', label: t('customize.spacing.normal') },
    { value: 'relaxed', label: t('customize.spacing.relaxed') },
  ];

  const sectionSpacingOptions = [
    { value: 'compact', label: t('customize.spacing.compact') },
    { value: 'medium', label: t('customize.spacing.medium') },
    { value: 'spacious', label: t('customize.spacing.spacious') },
  ];

  return (
    <CustomizeSectionCard
      title={t('customize.spacing.title')}
      description={t('customize.spacing.description')}
    >
      <div className="space-y-lg">
        <CustomizeButtonGroup
          label={t('customize.spacing.lineHeight')}
          options={lineHeightOptions}
          value={customize.lineHeight}
          onChange={(value) => updateCustomize('lineHeight', value)}
        />
        <CustomizeButtonGroup
          label={t('customize.spacing.sectionSpacing')}
          options={sectionSpacingOptions}
          value={customize.sectionSpacing}
          onChange={(value) => updateCustomize('sectionSpacing', value)}
        />
      </div>
    </CustomizeSectionCard>
  );
}
