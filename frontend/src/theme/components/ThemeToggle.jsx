import { Moon, MonitorSmartphone, Sun } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/utils';
import { useThemeSwitcher } from '../../hooks/useThemeSwitcher';

const THEME_ICONS = {
  light: Sun,
  dark: Moon,
  system: MonitorSmartphone,
};

export default function ThemeToggle({ className = '' }) {
  const { t } = useTranslation('common');
  const { themePreference, nextThemePreference, cycleTheme, isSaving } = useThemeSwitcher();
  const Icon = THEME_ICONS[themePreference] || Sun;

  return (
    <button
      type="button"
      onClick={cycleTheme}
      disabled={isSaving}
      aria-label={t(`themeToggle.switchTo.${nextThemePreference}`)}
      title={t(`themeToggle.modes.${themePreference}`)}
      className={cn(
        'inline-flex items-center justify-center rounded-xl border border-outline-variant/50 bg-white/80',
        'text-on-surface hover:border-secondary/40 hover:bg-white transition-colors',
        'disabled:opacity-60 min-h-[36px] min-w-[36px] px-2.5 py-1.5',
        'dark:bg-surface-container-low/80 dark:hover:bg-surface-container-low dark:border-outline-variant/50',
        className
      )}
    >
      <Icon className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden />
    </button>
  );
}
