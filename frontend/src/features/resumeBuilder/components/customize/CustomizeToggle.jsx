export default function CustomizeToggle({ label, description, checked, onChange, disabled = false }) {
  return (
    <label
      className={`flex items-center justify-between gap-md py-2 ${
        disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
      }`}
    >
      <span>
        <span className="block text-on-surface-variant text-sm">{label}</span>
        {description && (
          <span className="block text-on-surface-variant text-sm mt-0.5 opacity-80">
            {description}
          </span>
        )}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors shrink-0 border ${
          checked ? 'bg-secondary border-secondary' : 'bg-surface-container border-outline-variant'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface-container-lowest transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}
