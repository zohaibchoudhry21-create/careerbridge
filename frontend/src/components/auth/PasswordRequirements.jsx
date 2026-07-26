import { useTranslation } from 'react-i18next';
import { validatePassword } from '../../utils/passwordValidator';
import AppIcon from '../icons/AppIcon';

export default function PasswordRequirements({ password = '' }) {
  const { t } = useTranslation('auth');
  const { rules } = validatePassword(password);
  const showRules = password.length > 0;

  const getRuleLabel = (rule) => {
    if (rule.id === 'tooCommon') {
      return t('validation.rules.tooCommon');
    }
    return t(`validation.rules.${rule.id}`, { defaultValue: rule.message });
  };

  if (!showRules) {
    return (
      <p className="text-xs text-on-surface-variant mt-2">{t('validation.passwordHint')}</p>
    );
  }

  return (
    <ul className="mt-2 space-y-1">
      {rules.map((rule) => (
        <li
          key={rule.id}
          className={`text-xs flex items-start gap-2 ${
            rule.passed ? 'text-emerald-600' : 'text-error'
          }`}
        >
          <AppIcon
            name={rule.passed ? 'check_circle' : 'cancel'}
            size="h-3.5 w-3.5"
            className="mt-0.5"
          />
          <span>{getRuleLabel(rule)}</span>
        </li>
      ))}
    </ul>
  );
}
