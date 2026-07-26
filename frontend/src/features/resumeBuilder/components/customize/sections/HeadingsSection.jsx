import { useTranslation } from 'react-i18next';
import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function HeadingsSection() {
  const { t } = useTranslation('resumeBuilder');
  const { customize, updateCustomize } = useCustomizeDispatch();
  const previewText = t('customize.headings.previewText');

  const headingOptions = [
    {
      value: 'bold',
      label: t('customize.headings.bold'),
      preview: <span className="font-bold text-on-surface text-sm">{previewText}</span>,
    },
    {
      value: 'underline',
      label: t('customize.headings.underline'),
      preview: <span className="underline text-on-surface text-sm">{previewText}</span>,
    },
    {
      value: 'caps',
      label: t('customize.headings.allCaps'),
      preview: <span className="uppercase tracking-wide text-on-surface text-sm">{previewText}</span>,
    },
  ];

  return (
    <CustomizeSectionCard
      title={t('customize.headings.title')}
      description={t('customize.headings.description')}
    >
      <CustomizeButtonGroup
        options={headingOptions}
        value={customize.headingStyle}
        onChange={(value) => updateCustomize('headingStyle', value)}
      />
    </CustomizeSectionCard>
  );
}
