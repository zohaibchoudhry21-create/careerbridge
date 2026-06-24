import { ACCENT_COLOR_PRESETS } from '../../../data/resumeCustomizeDefaults';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function ColorsSection() {
  const { customize, updateCustomize } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard title="Colors" description="Pick an accent color for headings and highlights.">
      <div className="space-y-md">
        <p className="text-on-surface-variant text-sm">Preset colors</p>
        <div className="flex flex-wrap gap-3">
          {ACCENT_COLOR_PRESETS.map((preset) => {
            const isSelected = customize.accentColor === preset.value;

            return (
              <button
                key={preset.id}
                type="button"
                title={preset.token}
                onClick={() => updateCustomize('accentColor', preset.value)}
                className={`h-10 w-10 rounded-full border border-outline-variant transition-shadow ${
                  isSelected ? 'ring-2 ring-secondary ring-offset-2 ring-offset-surface-container-lowest' : ''
                }`}
                style={{ backgroundColor: preset.value }}
              />
            );
          })}
        </div>

        <label className="block space-y-2">
          <span className="text-on-surface-variant text-sm">Custom color</span>
          <div className="flex items-center gap-md">
            <input
              type="color"
              value={customize.accentColor}
              onChange={(event) => updateCustomize('accentColor', event.target.value)}
              className="h-10 w-14 cursor-pointer rounded-lg border border-outline-variant bg-surface-container-lowest p-1"
            />
            <span className="text-on-surface-variant text-sm font-body-sm uppercase">
              {customize.accentColor}
            </span>
          </div>
        </label>
      </div>
    </CustomizeSectionCard>
  );
}
