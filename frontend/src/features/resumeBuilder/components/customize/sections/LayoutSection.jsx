import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

const LAYOUT_OPTIONS = [
  { value: 'single', label: 'Single Column' },
  { value: 'two-column', label: 'Two Column' },
];

export default function LayoutSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard title="Layout" description="Control how content is arranged on the page.">
      <CustomizeButtonGroup
        options={LAYOUT_OPTIONS}
        value={customize.columns}
        onChange={(value) => updateCustomize('columns', value)}
      />
    </CustomizeSectionCard>
  );
}
