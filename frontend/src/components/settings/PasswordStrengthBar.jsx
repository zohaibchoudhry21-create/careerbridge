import { validatePassword } from '../../utils/passwordValidator';

export default function PasswordStrengthBar({ password = '' }) {
  if (!password) {
    return (
      <p className="text-xs app-muted mt-2">
        Use 8+ characters with uppercase, lowercase, number, and special character.
      </p>
    );
  }

  const { rules } = validatePassword(password);
  const passedCount = rules.filter((rule) => rule.passed).length;
  const strengthPercent = Math.round((passedCount / rules.length) * 100);

  const strengthLabel =
    strengthPercent < 40 ? 'Weak' : strengthPercent < 80 ? 'Fair' : 'Strong';
  const strengthColor =
    strengthPercent < 40 ? 'bg-error' : strengthPercent < 80 ? 'bg-amber-500' : 'bg-emerald-600';

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="app-muted">Password strength</span>
        <span className="font-medium app-heading">{strengthLabel}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-surface-container-high overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strengthColor}`}
          style={{ width: `${strengthPercent}%` }}
        />
      </div>
    </div>
  );
}
