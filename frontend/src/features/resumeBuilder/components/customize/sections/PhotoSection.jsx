import AppIcon from '../../../../../components/icons/AppIcon';
import CustomizeButtonGroup from '../CustomizeButtonGroup';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

const PHOTO_SHAPE_OPTIONS = [
  {
    value: 'circle',
    label: 'Circle',
    preview: <AppIcon name="account_circle" size="h-[22px] w-[22px]" />,
  },
  {
    value: 'square',
    label: 'Square',
    preview: <AppIcon name="crop_square" size="h-[22px] w-[22px]" />,
  },
];

export default function PhotoSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <div className={customize.showPhoto ? '' : 'opacity-50 pointer-events-none'}>
      <CustomizeSectionCard
        title="Photo"
        description={
          customize.showPhoto
            ? 'Choose how your profile photo is displayed.'
            : 'Enable Show photo in Header to edit photo shape.'
        }
      >
        <CustomizeButtonGroup
          options={PHOTO_SHAPE_OPTIONS}
          value={customize.photoShape}
          onChange={(value) => updateCustomize('photoShape', value)}
        />
      </CustomizeSectionCard>
    </div>
  );
}
