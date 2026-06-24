import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

const HEADING_OPTIONS = [
  {
    value: 'bold',
    label: 'Bold',
    preview: (
      <span className="font-bold text-on-surface text-sm">Work Experience</span>
    ),
  },
  {
    value: 'underline',
    label: 'Underline',
    preview: (
      <span className="underline text-on-surface text-sm">Work Experience</span>
    ),
  },
  {
    value: 'caps',
    label: 'All Caps',
    preview: (
      <span className="uppercase tracking-wide text-on-surface text-sm">Work Experience</span>
    ),
  },
];

export default function HeadingsSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard title="Headings" description="Style section headings across your resume.">
      <CustomizeButtonGroup
        options={HEADING_OPTIONS}
        value={customize.headingStyle}
        onChange={(value) => updateCustomize('headingStyle', value)}
      />
    </CustomizeSectionCard>
  );
}
