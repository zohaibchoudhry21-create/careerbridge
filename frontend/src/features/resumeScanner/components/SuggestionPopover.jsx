import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { buttonPrimaryClass, buttonSecondaryClass } from '../../../components/ui/buttonTokens';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';

export default function SuggestionPopover({
  suggestion,
  anchorRect,
  onAccept,
  onReject,
  onClose,
  isLoading = false,
}) {
  const { t } = useTranslation('resumeScanner');
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!suggestion || !anchorRect) {
    return null;
  }

  const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 220);
  const left = Math.min(Math.max(16, anchorRect.left), window.innerWidth - 320);

  return (
    <motion.div
      ref={popoverRef}
      role="dialog"
      aria-label={t('analysis.popover.title')}
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      className="fixed z-50 w-[min(300px,calc(100vw-32px))] rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-xl p-md"
      style={{ top, left }}
    >
      <div className="flex items-start justify-between gap-2 mb-sm">
        <p className="font-label-md text-on-surface">{t(`analysis.suggestionTypes.${suggestion.type}`)}</p>
        <button
          type="button"
          onClick={onClose}
          className="text-on-surface-variant hover:text-on-surface"
          aria-label={t('analysis.popover.close')}
        >
          <AppIcon name="x" size="sm" />
        </button>
      </div>

      {suggestion.reason ? (
        <p className="font-body-sm text-on-surface-variant mb-sm">{suggestion.reason}</p>
      ) : null}

      {suggestion.original || suggestion.suggested ? (
        <div className="rounded-lg bg-surface-container-low p-sm mb-sm space-y-1 font-body-sm">
          {suggestion.original ? (
            <p>
              <span className="text-on-surface-variant">{t('analysis.popover.original')}: </span>
              <span className="line-through text-error">{suggestion.original}</span>
            </p>
          ) : null}
          {suggestion.suggested ? (
            <p>
              <span className="text-on-surface-variant">{t('analysis.popover.suggested')}: </span>
              <span className="text-green-700 font-medium">{suggestion.suggested}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {suggestion.impact ? (
        <p className="font-label-sm text-secondary mb-md">
          {t('analysis.popover.impact', { points: suggestion.impact })}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onReject?.(suggestion)}
          className={cn(buttonSecondaryClass, 'flex-1 py-2 text-sm')}
        >
          {t('analysis.popover.reject')}
        </button>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onAccept?.(suggestion)}
          className={cn(buttonPrimaryClass, 'flex-1 py-2 text-sm')}
        >
          {t('analysis.popover.accept')}
        </button>
      </div>
    </motion.div>
  );
}
