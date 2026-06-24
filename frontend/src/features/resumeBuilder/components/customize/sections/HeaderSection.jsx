import CustomizeSectionCard from '../CustomizeSectionCard';
import CustomizeToggle from '../CustomizeToggle';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function HeaderSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard title="Header" description="Control what appears in your resume header area.">
      <CustomizeToggle
        label="Show photo"
        description="When off, the Photo section is disabled."
        checked={customize.showPhoto}
        onChange={(value) => updateCustomize('showPhoto', value)}
      />
    </CustomizeSectionCard>
  );
}
