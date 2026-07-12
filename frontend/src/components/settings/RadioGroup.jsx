export default function RadioGroup({ name, value, onChange, options = [] }) {
  return (
    <div className="space-y-2">
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const optionLabel = typeof option === 'string' ? option : option.label;
        const optionDescription = typeof option === 'object' ? option.description : null;

        return (
          <label
            key={optionValue}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-all duration-200 hover:border-secondary/30 ${
              value === optionValue
                ? 'border-secondary bg-secondary/5'
                : 'border-outline-variant/40 bg-surface-container-lowest'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={optionValue}
              checked={value === optionValue}
              onChange={() => onChange(optionValue)}
              className="mt-1 h-4 w-4 text-secondary focus:ring-secondary"
            />
            <span className="min-w-0">
              <span className="font-label-md text-on-surface block">{optionLabel}</span>
              {optionDescription ? (
                <span className="font-body-md text-on-surface-variant text-sm mt-0.5 block">
                  {optionDescription}
                </span>
              ) : null}
            </span>
          </label>
        );
      })}
    </div>
  );
}
