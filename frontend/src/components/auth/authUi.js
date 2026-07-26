import { buttonPrimaryClass } from '../ui/buttonTokens';

export const authInputClassName =
  'w-full px-4 py-3 bg-white border border-outline-variant/50 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all duration-200 outline-none';

export const authInputPasswordClassName = `${authInputClassName} pe-12`;

export const authSubmitClassName = [
  buttonPrimaryClass,
  'w-full gap-2 rounded-2xl py-3.5 text-label-md shadow-md shadow-secondary/20',
  'hover:shadow-lg hover:shadow-secondary/30 active:scale-[0.98] duration-200',
  'disabled:opacity-70',
].join(' ');

export function getAuthFieldClassName(baseClassName, hasError) {
  if (!hasError) return baseClassName;
  return `${baseClassName} border-error focus:border-error focus:ring-error/15`;
}

export function getAuthIconColor(focusedField, field) {
  return focusedField === field ? '#0058be' : '#76777d';
}
