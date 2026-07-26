/** i18next language codes that use right-to-left document layout. */
export const RTL_I18N_LANGUAGE_CODES = ['ur'];

export function resolveDocumentDirection(languageCode) {
  return RTL_I18N_LANGUAGE_CODES.includes(languageCode) ? 'rtl' : 'ltr';
}

export function applyDocumentDirection(languageCode) {
  if (typeof document === 'undefined') return;

  const dir = resolveDocumentDirection(languageCode);
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', languageCode);
}
