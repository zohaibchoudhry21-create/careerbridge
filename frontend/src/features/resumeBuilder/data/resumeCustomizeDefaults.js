export const ACCENT_COLOR_PRESETS = [
  { id: 'secondary', value: '#0058be', token: 'secondary' },
  { id: 'primary-container', value: '#131b2e', token: 'primary-container' },
  { id: 'secondary-container', value: '#2170e4', token: 'secondary-container' },
  { id: 'error', value: '#ba1a1a', token: 'error' },
  { id: 'tertiary', value: '#000000', token: 'tertiary' },
  { id: 'on-tertiary-fixed-variant', value: '#444749', token: 'on-tertiary-fixed-variant' },
];

/** Original primary accent per template (matches pre-customize hardcoded colors). */
export const TEMPLATE_ACCENT_COLORS = {
  'classic-clear': '#0b1c30',
  'atlantic-clear': '#131b2e',
  'mercury-clear': '#1f2937',
  'steady-form': '#1a2b4a',
};

export const DEFAULT_CUSTOMIZE = {
  language: 'English (UK)',
  dateFormat: 'DD/MM/YYYY',
  pageFormat: 'A4',
  fontFamily: 'Inter',
  fontSize: 'medium',
  lineHeight: 'normal',
  sectionSpacing: 'medium',
  columns: 'single',
  accentColor: '#0058be',
  showPhoto: true,
  photoShape: 'circle',
  showDates: true,
  showLocation: true,
  headingStyle: 'bold',
  showPageNumbers: false,
};

export const getTemplateAccentColor = (templateId) =>
  TEMPLATE_ACCENT_COLORS[templateId] || DEFAULT_CUSTOMIZE.accentColor;

export const mergeCustomize = (saved = {}, templateId = null) => {
  const templateAccent = templateId ? getTemplateAccentColor(templateId) : null;
  const merged = { ...DEFAULT_CUSTOMIZE, ...saved };

  if (
    templateAccent &&
    (saved.accentColor == null || saved.accentColor === DEFAULT_CUSTOMIZE.accentColor)
  ) {
    merged.accentColor = templateAccent;
  }

  return merged;
};
