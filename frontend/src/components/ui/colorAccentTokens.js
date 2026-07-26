/**
 * Semantic color accents for section icon badges and selectable option states.
 *
 * Reference: Mock Interview Setup (Customize your interview) — each section heading
 * gets a tinted icon badge; selected options use secondary blue tint + border.
 *
 * Usage:
 *   import { ACCENT_COLORS, selectedOptionClass, unselectedOptionClass } from './colorAccentTokens';
 *   <SectionIcon color="role" icon="person" />
 */

/** @typedef {'sm' | 'md' | 'lg'} SectionIconSize */

/**
 * Per-accent Tailwind classes: soft tinted background + saturated icon color.
 * Dark mode uses low-opacity backgrounds so tints stay readable on dark surfaces.
 */
export const ACCENT_COLORS = {
  role: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
  difficulty: 'bg-orange-50 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400',
  time: 'bg-teal-50 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
  focus: 'bg-pink-50 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400',
  mode: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  skills: 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400',
  resume: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
  settings: 'bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
  security: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  success: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
  danger: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
  linkedin: 'bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400',
  scanner: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400',
  interview: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
};

/** Hex reference for design docs / Figma (light mode icon shades). */
export const ACCENT_HEX = {
  role: { bg: '#eff6ff', icon: '#2563eb' },
  difficulty: { bg: '#fff7ed', icon: '#ea580c' },
  time: { bg: '#f0fdfa', icon: '#0d9488' },
  focus: { bg: '#fdf2f8', icon: '#db2777' },
  mode: { bg: '#ecfdf5', icon: '#059669' },
  skills: { bg: '#faf5ff', icon: '#9333ea' },
  resume: { bg: '#eef2ff', icon: '#4f46e5' },
  settings: { bg: '#f5f3ff', icon: '#7c3aed' },
  security: { bg: '#fffbeb', icon: '#d97706' },
  success: { bg: '#ecfdf5', icon: '#059669' },
  warning: { bg: '#fffbeb', icon: '#d97706' },
  danger: { bg: '#fff1f2', icon: '#e11d48' },
  linkedin: { bg: '#f0f9ff', icon: '#0284c7' },
  scanner: { bg: '#ecfeff', icon: '#0891b2' },
  interview: { bg: '#eff6ff', icon: '#2563eb' },
};

/** Selected option: project secondary blue border + ~6% tint (matches Customize Interview). */
export const selectedOptionClass =
  'border-secondary bg-secondary/[0.06] text-secondary dark:border-secondary/70 dark:bg-secondary/20 dark:text-[#93c5fd]';

/** Unselected option: neutral grey border, white fill, muted label. */
export const unselectedOptionClass =
  'border-[#E2E7EE] bg-white text-on-surface-variant hover:border-[#C3CBD6] hover:bg-[#FAFBFC] dark:border-outline-variant dark:bg-surface-container-lowest dark:hover:bg-surface-container-low';

/** Section card shell (Customize Interview card style). */
export const accentCardClass =
  'rounded-2xl border border-[#E7EBF0] bg-white p-5 space-y-3.5 min-w-0 transition-all duration-150 hover:border-[#D4DAE2] dark:border-outline-variant/40 dark:bg-surface-container-lowest';

export const SECTION_ICON_SIZES = {
  sm: 'h-8 w-8 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-11 w-11 rounded-xl',
};

/**
 * @param {keyof typeof ACCENT_COLORS} color
 * @returns {string}
 */
export function getAccentClasses(color) {
  return ACCENT_COLORS[color] ?? ACCENT_COLORS.role;
}
