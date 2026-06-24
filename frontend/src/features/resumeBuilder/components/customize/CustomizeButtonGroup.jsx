export default function CustomizeButtonGroup({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      {label && <p className="text-on-surface-variant text-sm">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = value === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`rounded-lg px-md py-sm font-label-sm transition-colors border ${
                isActive
                  ? 'bg-secondary text-on-secondary border-secondary'
                  : 'bg-surface-container-low border-outline-variant text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {option.preview ? (
                <span className="flex flex-col items-center gap-1">
                  {option.preview}
                  <span>{option.label}</span>
                </span>
              ) : (
                option.label
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
