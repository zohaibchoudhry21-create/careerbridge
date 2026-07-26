import { useTranslation } from 'react-i18next';
import CustomizeSectionCard from '../CustomizeSectionCard';
import CustomizeToggle from '../CustomizeToggle';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function EntriesSection() {
  const { t } = useTranslation('resumeBuilder');
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard
      title={t('customize.entries.title')}
      description={t('customize.entries.description')}
    >
      <div className="divide-y divide-outline-variant/40">
        <CustomizeToggle
          label={t('customize.entries.showDates')}
          checked={customize.showDates}
          onChange={(value) => updateCustomize('showDates', value)}
        />
        <CustomizeToggle
          label={t('customize.entries.showLocation')}
          checked={customize.showLocation}
          onChange={(value) => updateCustomize('showLocation', value)}
        />
      </div>
    </CustomizeSectionCard>
  );
}
