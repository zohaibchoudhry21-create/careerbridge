import { FONT_FAMILY_OPTIONS } from '../constants';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function FontSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard title="Font" description="Select the typeface for your resume content.">
      <ul className="space-y-2">
        {FONT_FAMILY_OPTIONS.map((font) => {
          const isSelected = customize.fontFamily === font;

          return (
            <li key={font}>
              <button
                type="button"
                onClick={() => updateCustomize('fontFamily', font)}
                className={`w-full text-left rounded-lg border px-md py-sm transition-colors ${
                  isSelected
                    ? 'border-secondary text-secondary bg-secondary/5'
                    : 'border-outline-variant text-on-surface hover:bg-surface-container-low'
                }`}
                style={{ fontFamily: `${font}, sans-serif` }}
              >
                {font}
              </button>
            </li>
          );
        })}
      </ul>
    </CustomizeSectionCard>
  );
}
