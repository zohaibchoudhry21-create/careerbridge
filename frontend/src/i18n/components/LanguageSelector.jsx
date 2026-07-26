import { useTranslation } from 'react-i18next';
import AppIcon from '../../components/icons/AppIcon';
import { cn } from '../../lib/utils';
import { useLanguageMenu, useLanguageSwitcher } from '../../hooks/useLanguageSwitcher';

export default function LanguageSelector({ className = '', compact = false }) {
  const { t } = useTranslation('common');
  const { options, currentI18nCode, currentDisplayCode, isSaving, setLanguageByI18nCode } =
    useLanguageSwitcher();
  const { open, containerRef, close, toggle } = useLanguageMenu();

  const handleSelect = async (i18nCode) => {
    close();
    if (i18nCode === currentI18nCode) return;
    await setLanguageByI18nCode(i18nCode);
  };

  return (
    <div ref={containerRef} className={cn('relative shrink-0', className)}>
      <button
        type="button"
        onClick={toggle}
        aria-label={t('languageSelector.label')}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={isSaving}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/50 bg-white/80 px-2.5 py-1.5',
          'font-label-md app-heading hover:border-secondary/40 hover:bg-white transition-colors',
          'dark:bg-[#1a2332]/90 dark:border-[#334155] dark:hover:bg-[#243044]',
          'disabled:opacity-60 min-h-[36px]',
          compact && 'px-2 py-1'
        )}
      >
        <AppIcon name="language" size="h-4 w-4" className="app-muted" />
        <span className="tracking-wide">{currentDisplayCode}</span>
        <AppIcon name="expand_more" size="h-4 w-4" className="app-muted" />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t('languageSelector.label')}
          className="absolute end-0 top-full z-50 mt-2 min-w-[10rem] overflow-hidden rounded-xl border border-outline-variant/40 bg-white py-1 shadow-level-2 dark:bg-[#1a2332] dark:border-[#334155]"
        >
          {options.map((option) => {
            const selected = option.i18nCode === currentI18nCode;

            return (
              <li key={option.i18nCode} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => handleSelect(option.i18nCode)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start font-label-md transition-colors',
                    selected
                      ? 'bg-secondary/10 text-secondary dark:bg-secondary/20'
                      : 'app-heading hover:bg-surface-container dark:hover:bg-[#243044]'
                  )}
                >
                  <span>{option.label}</span>
                  <span className="text-xs tracking-wide app-muted">{option.display}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
