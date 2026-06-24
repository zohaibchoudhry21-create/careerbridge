export const authInputClassName =
  'w-full px-4 py-3 bg-white border border-outline-variant/50 rounded-2xl text-on-surface placeholder:text-on-surface-variant/50 focus:bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all duration-200 outline-none';

export const authInputPasswordClassName = `${authInputClassName} pr-12`;

export const authSubmitClassName =
  'w-full bg-secondary text-on-secondary font-label-md text-label-md py-3.5 rounded-2xl hover:bg-secondary-container hover:shadow-lg hover:shadow-secondary/30 transition-all duration-200 active:scale-[0.98] shadow-md shadow-secondary/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2';

export function getAuthFieldClassName(baseClassName, hasError) {
  if (!hasError) return baseClassName;
  return `${baseClassName} border-error focus:border-error focus:ring-error/15`;
}

export function getAuthIconColor(focusedField, field) {
  return focusedField === field ? '#0058be' : '#76777d';
}
