import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

const FONT_SIZE_OPTIONS = [
  {
    value: 'small',
    label: 'Small',
    preview: <span className="text-xs font-semibold">Aa</span>,
  },
  {
    value: 'medium',
    label: 'Medium',
    preview: <span className="text-base font-semibold">Aa</span>,
  },
  {
    value: 'large',
    label: 'Large',
    preview: <span className="text-xl font-semibold">Aa</span>,
  },
];

export default function FontSizeSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard title="Font Size" description="Adjust the overall text size of your resume.">
      <CustomizeButtonGroup
        options={FONT_SIZE_OPTIONS}
        value={customize.fontSize}
        onChange={(value) => updateCustomize('fontSize', value)}
      />
    </CustomizeSectionCard>
  );
}
