import { settingsInputClassName, settingsLabelClassName } from './settingsStyles';

export default function SelectField({ id, label, value, onChange, options = [], className = '' }) {
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
        className={settingsInputClassName}
      >
        {options.map((option) => (
          <option key={option || '__empty__'} value={option}>
            {option || '—'}
          </option>
        ))}
      </select>
    </div>
  );
}
