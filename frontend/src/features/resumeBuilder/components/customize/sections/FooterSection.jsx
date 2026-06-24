import CustomizeSectionCard from '../CustomizeSectionCard';
import CustomizeToggle from '../CustomizeToggle';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function FooterSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard title="Footer" description="Footer options for printed and PDF resumes.">
      <CustomizeToggle
        label="Show page numbers"
        checked={customize.showPageNumbers}
        onChange={(value) => updateCustomize('showPageNumbers', value)}
      />
    </CustomizeSectionCard>
  );
}
