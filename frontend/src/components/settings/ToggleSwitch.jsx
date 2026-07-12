export default function ToggleSwitch({ id, label, description, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-outline-variant/20 last:border-b-0">
      <div className="min-w-0">
        <label htmlFor={id} className="font-label-md text-on-surface block cursor-pointer">
          {label}
        </label>
        {description ? (
          <p className="font-body-md text-on-surface-variant text-sm mt-1">{description}</p>
        ) : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 border disabled:opacity-50 ${
          checked ? 'bg-secondary border-secondary' : 'bg-surface-container border-outline-variant'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
