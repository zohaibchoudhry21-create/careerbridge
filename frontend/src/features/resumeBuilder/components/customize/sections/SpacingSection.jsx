import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

const LINE_HEIGHT_OPTIONS = [
  { value: 'compact', label: 'Compact' },
  { value: 'normal', label: 'Normal' },
  { value: 'relaxed', label: 'Relaxed' },
];

const SECTION_SPACING_OPTIONS = [
  { value: 'compact', label: 'Compact' },
  { value: 'medium', label: 'Medium' },
  { value: 'spacious', label: 'Spacious' },
];

export default function SpacingSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard title="Spacing" description="Fine-tune line height and space between sections.">
      <div className="space-y-lg">
        <CustomizeButtonGroup
          label="Line height"
          options={LINE_HEIGHT_OPTIONS}
          value={customize.lineHeight}
          onChange={(value) => updateCustomize('lineHeight', value)}
        />
        <CustomizeButtonGroup
          label="Section spacing"
          options={SECTION_SPACING_OPTIONS}
          value={customize.sectionSpacing}
          onChange={(value) => updateCustomize('sectionSpacing', value)}
        />
      </div>
    </CustomizeSectionCard>
  );
}
