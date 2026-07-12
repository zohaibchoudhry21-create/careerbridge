export default function SectionHeader({ title, description }) {
  return (
    <div className="min-w-0 mb-md">
      <h2 className="font-headline-section text-headline-section text-on-surface">{title}</h2>
      {description ? (
        <p className="font-body-md text-on-surface-variant text-sm mt-1">{description}</p>
      ) : null}
    </div>
  );
}
