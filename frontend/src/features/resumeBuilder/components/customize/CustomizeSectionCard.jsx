export default function CustomizeSectionCard({ title, description, children }) {
  return (
    <div className="bg-surface-container-lowest rounded-xl border border-outline-variant p-sm space-y-sm">
      {title && <h3 className="text-on-surface font-semibold font-headline-sm">{title}</h3>}
      {description && (
        <p className="text-on-surface-variant text-sm font-body-sm">{description}</p>
      )}
      {children}
    </div>
  );
}
