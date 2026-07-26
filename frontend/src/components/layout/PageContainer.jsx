/**
 * Standard content wrapper for every page rendered inside DashboardLayout.
 *
 * DashboardLayout's <main> already owns the horizontal/top padding and the
 * 1280px outer bound, so pages must never add their own pt-* here — that was
 * the source of the 80px-vs-32px top-padding drift across the app.
 *
 * width:
 *   wide     - inherits the layout's 1280px (dashboards, card grids)
 *   standard - 960px centered (setup forms, settings, live interview)
 *   narrow   - 768px centered (quizzes, reading-heavy content)
 */
const WIDTHS = {
  wide: '',
  standard: 'max-w-[960px] mx-auto',
  narrow: 'max-w-[768px] mx-auto',
};

export default function PageContainer({ width = 'wide', className = '', children }) {
  const widthClass = WIDTHS[width] ?? WIDTHS.wide;

  return (
    <div className={`min-w-0 w-full space-y-md ${widthClass} ${className}`.trim()}>{children}</div>
  );
}
