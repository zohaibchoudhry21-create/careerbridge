/**
 * Standard page title block: 26px heading + 4px-gap subtitle, with optional
 * right-aligned actions. Vertical spacing comes from PageContainer's space-y,
 * so this never sets its own margins.
 */
export default function PageHeader({
  title,
  description,
  actions = null,
  align = 'left',
  className = '',
}) {
  const layout =
    align === 'center'
      ? 'flex flex-col items-center text-center gap-sm'
      : 'flex flex-wrap items-start justify-between gap-sm';

  return (
    <header className={`min-w-0 ${layout} ${className}`.trim()}>
      <div className="min-w-0">
        <h1 className="font-headline-dashboard text-headline-dashboard app-heading">{title}</h1>
        {description ? (
          <p className="font-body-md app-muted mt-base">{description}</p>
        ) : null}
      </div>
      {actions}
    </header>
  );
}
