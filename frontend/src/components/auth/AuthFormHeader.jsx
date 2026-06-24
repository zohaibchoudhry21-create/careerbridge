export default function AuthFormHeader({ title, subtitle }) {
  return (
    <header className="mb-6 text-center">
      <h1 className="font-headline-md text-headline-md text-on-surface">{title}</h1>
      {subtitle ? (
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{subtitle}</p>
      ) : null}
    </header>
  );
}
