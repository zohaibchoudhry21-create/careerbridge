import AppIcon from '../icons/AppIcon';
import { settingsInputClassName, settingsLabelClassName } from './settingsStyles';

export default function InputField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  readOnly = false,
  required = false,
  error,
  className = '',
  ...props
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label ? (
        <label className={settingsLabelClassName} htmlFor={id}>
          {label}
          {required ? <span className="text-error"> *</span> : null}
        </label>
      ) : null}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        className={`${settingsInputClassName} ${readOnly ? 'bg-surface-container cursor-default' : ''} ${error ? 'ring-2 ring-error' : ''}`}
        {...props}
      />
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  className = '',
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      {label ? (
        <label className={settingsLabelClassName} htmlFor={id}>
          {label}
        </label>
      ) : null}
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`${settingsInputClassName} resize-y min-h-[120px] ${error ? 'ring-2 ring-error' : ''}`}
      />
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}

export function PasswordField({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
  error,
  required = false,
}) {
  return (
    <div className="space-y-1">
      <label className={settingsLabelClassName} htmlFor={id}>
        {label}
        {required ? <span className="text-error"> *</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={`${settingsInputClassName} pr-12 ${error ? 'ring-2 ring-error' : ''}`}
          autoComplete={id.includes('current') ? 'current-password' : 'new-password'}
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-secondary transition-colors"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          <AppIcon name={showPassword ? 'visibility_off' : 'visibility'} size="h-5 w-5" />
        </button>
      </div>
      {error ? <p className="text-sm text-error">{error}</p> : null}
    </div>
  );
}
