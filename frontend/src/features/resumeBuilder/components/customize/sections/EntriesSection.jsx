import CustomizeSectionCard from '../CustomizeSectionCard';
import CustomizeToggle from '../CustomizeToggle';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function EntriesSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard title="Entries" description="Choose what details appear in experience and education entries.">
      <div className="divide-y divide-outline-variant/40">
        <CustomizeToggle
          label="Show dates"
          checked={customize.showDates}
          onChange={(value) => updateCustomize('showDates', value)}
        />
        <CustomizeToggle
          label="Show location"
          checked={customize.showLocation}
          onChange={(value) => updateCustomize('showLocation', value)}
        />
      </div>
    </CustomizeSectionCard>
  );
}
