import { settingsSectionCardClassName } from './settingsStyles';

export default function SectionCard({ title, description, children, className = '' }) {
  return (
    <section className={`${settingsSectionCardClassName} ${className}`}>
      {title ? (
        <header className="mb-md">
          <h3 className="font-headline-section text-headline-section text-on-surface">{title}</h3>
          {description ? (
            <p className="font-body-md text-on-surface-variant text-sm mt-1">{description}</p>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
