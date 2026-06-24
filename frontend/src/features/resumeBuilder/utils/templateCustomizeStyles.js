import { DEFAULT_CUSTOMIZE, mergeCustomize } from '../data/resumeCustomizeDefaults';

const FONT_SIZE_MAP = {
  small: 11,
  medium: 13,
  large: 15,
};

const LINE_HEIGHT_MAP = {
  compact: 1.3,
  normal: 1.5,
  relaxed: 1.8,
};

const SECTION_SPACING_MAP = {
  compact: 4,
  medium: 12,
  spacious: 24,
};

const HEADING_STYLE_MAP = {
  bold: { fontWeight: 700, textDecoration: 'none', textTransform: 'none' },
  underline: { fontWeight: 600, textDecoration: 'underline', textTransform: 'none' },
  caps: { fontWeight: 600, textDecoration: 'none', textTransform: 'uppercase' },
};

export function hexToRgba(hex = '#0058be', alpha = 1) {
  const clean = String(hex).replace('#', '');
  const full =
    clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(0, 88, 190, ${alpha})`;
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function resolveTemplateTheme(customize, templateId = null) {
  const merged = mergeCustomize(customize || {}, templateId);
  const baseFontSize = FONT_SIZE_MAP[merged.fontSize] || FONT_SIZE_MAP.medium;
  const scale = baseFontSize / FONT_SIZE_MAP.medium;
  const accentColor = merged.accentColor || DEFAULT_CUSTOMIZE.accentColor;

  return {
    ...merged,
    accentColor,
    baseFontSize,
    bodyFontSize: Math.round(11 * scale),
    smallFontSize: Math.round(10 * scale),
    headingFontSize: Math.round(11 * scale),
    titleFontSize: Math.round(12 * scale),
    lineHeight: LINE_HEIGHT_MAP[merged.lineHeight] || LINE_HEIGHT_MAP.normal,
    sectionSpacing: SECTION_SPACING_MAP[merged.sectionSpacing] ?? SECTION_SPACING_MAP.medium,
    headingStyle: HEADING_STYLE_MAP[merged.headingStyle] || HEADING_STYLE_MAP.bold,
    photoBorderRadius: merged.photoShape === 'square' ? '0' : '50%',
    showPhoto: merged.showPhoto !== false,
    showDates: merged.showDates !== false,
    showLocation: merged.showLocation !== false,
    showPageNumbers: Boolean(merged.showPageNumbers),
    accentSurface: hexToRgba(accentColor, 0.12),
    accentRule: hexToRgba(accentColor, 0.35),
    wrapperStyle: {
      fontFamily: `${merged.fontFamily || DEFAULT_CUSTOMIZE.fontFamily}, system-ui, sans-serif`,
      fontSize: baseFontSize,
    },
  };
}

export function sectionStyle(theme) {
  return { marginBottom: theme.sectionSpacing };
}
