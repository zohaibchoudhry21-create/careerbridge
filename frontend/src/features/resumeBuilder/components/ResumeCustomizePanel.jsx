import { useTranslation } from 'react-i18next';
import { ACCENT_COLOR_PRESETS, DEFAULT_CUSTOMIZE } from '../data/resumeCustomizeDefaults';
import TemplatePicker from './TemplatePicker';
import { cn } from '../../../lib/utils';

const FONT_SIZES = ['small', 'medium', 'large'];
const LINE_HEIGHTS = ['compact', 'normal', 'relaxed'];
const SECTION_SPACINGS = ['compact', 'medium', 'spacious'];
const HEADING_STYLES = ['bold', 'underline', 'caps'];

function OptionPills({ options, value, onChange, labelPrefix }) {
  const { t } = useTranslation('resumeBuilder');
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'rounded-lg border px-2.5 py-1 font-label-sm transition-colors',
            value === opt
              ? 'border-secondary bg-secondary/10 text-secondary'
              : 'border-outline-variant text-on-surface-variant hover:border-outline'
          )}
        >
          {t(`${labelPrefix}.${opt}`, { defaultValue: opt })}
        </button>
      ))}
    </div>
  );
}

export default function ResumeCustomizePanel({
  templateId,
  onTemplateChange,
  customize,
  onCustomizeChange,
}) {
  const { t } = useTranslation('resumeBuilder');

  const patch = (key, value) => {
    onCustomizeChange({ ...customize, [key]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-label-md text-on-surface">{t('customize.templates.title')}</h3>
        <p className="font-body-md text-sm app-muted mt-0.5 mb-2">{t('customize.templates.description')}</p>
        <TemplatePicker selected={templateId} onChange={onTemplateChange} />
      </div>

      <div className="rounded-xl border border-outline-variant bg-surface-container-low/50 p-3 space-y-3">
        <div>
          <p className="font-label-sm text-on-surface mb-1.5">{t('customize.fontSize.title')}</p>
          <OptionPills
            options={FONT_SIZES}
            value={customize.fontSize || DEFAULT_CUSTOMIZE.fontSize}
            onChange={(v) => patch('fontSize', v)}
            labelPrefix="customize.fontSize"
          />
        </div>

        <div>
          <p className="font-label-sm text-on-surface mb-1.5">{t('customize.spacing.lineHeight')}</p>
          <OptionPills
            options={LINE_HEIGHTS}
            value={customize.lineHeight || DEFAULT_CUSTOMIZE.lineHeight}
            onChange={(v) => patch('lineHeight', v)}
            labelPrefix="customize.spacing"
          />
        </div>

        <div>
          <p className="font-label-sm text-on-surface mb-1.5">{t('customize.spacing.sectionSpacing')}</p>
          <OptionPills
            options={SECTION_SPACINGS}
            value={customize.sectionSpacing || DEFAULT_CUSTOMIZE.sectionSpacing}
            onChange={(v) => patch('sectionSpacing', v)}
            labelPrefix="customize.spacing"
          />
        </div>

        <div>
          <p className="font-label-sm text-on-surface mb-1.5">{t('customize.headings.title')}</p>
          <OptionPills
            options={HEADING_STYLES}
            value={customize.headingStyle || DEFAULT_CUSTOMIZE.headingStyle}
            onChange={(v) => patch('headingStyle', v)}
            labelPrefix="customize.headings"
          />
        </div>

        <div>
          <p className="font-label-sm text-on-surface mb-1.5">{t('customize.colors.title')}</p>
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                title={preset.value}
                onClick={() => patch('accentColor', preset.value)}
                className={cn(
                  'h-8 w-8 rounded-full border-2 transition-transform hover:scale-105',
                  customize.accentColor === preset.value ? 'border-secondary ring-2 ring-secondary/30' : 'border-white'
                )}
                style={{ backgroundColor: preset.value }}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="font-label-sm text-on-surface">{t('customize.header.showPhoto')}</span>
          <input
            type="checkbox"
            checked={customize.showPhoto !== false}
            onChange={(e) => patch('showPhoto', e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary"
          />
        </label>

        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="font-label-sm text-on-surface">{t('customize.entries.showDates')}</span>
          <input
            type="checkbox"
            checked={customize.showDates !== false}
            onChange={(e) => patch('showDates', e.target.checked)}
            className="h-4 w-4 rounded border-outline-variant text-secondary focus:ring-secondary"
          />
        </label>
      </div>
    </div>
  );
}
