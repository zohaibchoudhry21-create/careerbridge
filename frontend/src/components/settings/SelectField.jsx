import { settingsInputClassName, settingsLabelClassName } from './settingsStyles';

export default function SelectField({ id, label, value, onChange, options = [], className = '' }) {
  const normalizedOptions = options.map((option) => {
    if (typeof option === 'object' && option !== null) {
      return {
        value: option.value ?? '',
        label: option.label ?? option.value ?? '—',
      };
    }

    return {
      value: option,
      label: option || '—',
    };
  });

  return (
    <div className={`space-y-1 ${className}`}>
      {label ? (
        <label className={settingsLabelClassName} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <select
        id={id}
        value={value}
        onChange={onChange}
        className={`${settingsInputClassName} text-start`}
      >
        {normalizedOptions.map((option) => (
          <option key={option.value || '__empty__'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
