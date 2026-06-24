export default function AuthFormDivider({ label }) {
  return (
    <div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-outline-variant/50" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-4 font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
          {label}
        </span>
      </div>
    </div>
  );
}
