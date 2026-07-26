import { useTranslation } from 'react-i18next';
import { changeAppLanguage } from '../syncLanguage.js';
import { I18N_LANGUAGE_CODES, LANGUAGE_DISPLAY_CODES } from '../languagePreference.js';

/**
 * Temporary Settings-hub control for Phase B5 RTL validation.
 * Replaced by the navbar language selector in Phase B6.
 */
export default function RtlLanguagePreview() {
  const { i18n, t } = useTranslation('settings');

  return (
    <div className="rounded-xl border border-dashed border-secondary/40 bg-secondary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p className="font-body-md text-sm text-on-surface-variant">{t('hub.rtlPreview.note')}</p>
      <label className="inline-flex items-center gap-2 font-label-md text-on-surface shrink-0">
        <span>{t('hub.rtlPreview.label')}</span>
        <select
          value={i18n.language}
          onChange={(event) => changeAppLanguage(event.target.value)}
          className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm"
        >
          {I18N_LANGUAGE_CODES.map((code) => (
            <option key={code} value={code}>
              {LANGUAGE_DISPLAY_CODES[code]}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
