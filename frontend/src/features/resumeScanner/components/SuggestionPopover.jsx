import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';

export default function SuggestionPopover({
  suggestion,
  anchorRect,
  onAccept,
  onReject,
  onClose,
  isLoading = false,
  layout = 'floating',
}) {
  const { t } = useTranslation('resumeScanner');
  const popoverRef = useRef(null);
  const isPanel = layout === 'panel';

  useEffect(() => {
    if (isPanel) return undefined;

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
  }, [onClose, isPanel]);

  if (!suggestion) {
    return null;
  }

  const hasSuggested = Boolean(suggestion.suggested);
  const isUnappliable = suggestion.status === 'unappliable';

  const panelClasses =
    'w-full max-w-sm shrink-0 bg-white border-l border-slate-200 text-sm overflow-hidden font-sans flex flex-col min-h-0';
  const floatingClasses =
    'fixed z-[100] w-80 bg-white rounded-lg shadow-xl border border-slate-200 text-sm overflow-hidden font-sans';

  let floatingStyle = undefined;
  if (!isPanel && anchorRect) {
    const top = Math.min(anchorRect.bottom + 8, window.innerHeight - 280);
    const left = Math.min(Math.max(16, anchorRect.left), window.innerWidth - 340);
    floatingStyle = { top, left };
  }

  if (!isPanel && !anchorRect) {
    return null;
  }

  return (
    <motion.div
      ref={popoverRef}
      role="dialog"
      aria-label={t('analysis.popover.title')}
      initial={isPanel ? { opacity: 0, x: 12 } : { opacity: 0, y: 8, scale: 0.95 }}
      animate={isPanel ? { opacity: 1, x: 0 } : { opacity: 1, y: 0, scale: 1 }}
      exit={isPanel ? { opacity: 0, x: 12 } : { opacity: 0, y: 8, scale: 0.95 }}
      className={cn(isPanel ? panelClasses : floatingClasses)}
      style={floatingStyle}
    >
      <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-start gap-2 shrink-0">
        <div className="min-w-0">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <AppIcon name="sparkles" size="sm" className="text-blue-600" />
            {t('analysis.popover.title')}
          </span>
          {suggestion.reason ? (
            <p className="text-xs text-slate-500 mt-1">{suggestion.reason}</p>
          ) : null}
          {isUnappliable ? (
            <p className="text-xs text-amber-700 mt-1">
              {suggestion.applyError === 'original_not_found_in_field' ||
              suggestion.applyError === 'no_field_path' ||
              suggestion.applyError === 'field_path_out_of_bounds'
                ? t('analysis.popover.unappliableNoMatch')
                : t('analysis.popover.unappliableMessage')}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {suggestion.impact ? (
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded whitespace-nowrap">
              {t('analysis.popover.impactShort', { points: suggestion.impact })}
            </span>
          ) : null}
          {isPanel ? (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded hover:bg-slate-200 text-slate-400"
              aria-label={t('analysis.popover.close')}
            >
              <AppIcon name="close" size="sm" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="p-3 overflow-y-auto flex-1 min-h-0">
        {suggestion.original ? (
          <div className="mb-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              {t('analysis.popover.currentText')}
            </span>
            <div className="line-through text-slate-500 bg-slate-100 px-2 py-1 rounded text-xs break-words">
              {suggestion.original}
            </div>
          </div>
        ) : null}

        <div className="mb-4">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
            {t('analysis.popover.suggestedChange')}
          </span>
          <div
            className={cn(
              'px-2 py-1 rounded font-medium text-xs border break-words',
              hasSuggested
                ? 'text-green-700 bg-green-50 border-green-100'
                : 'text-red-600 bg-red-50 border-red-100'
            )}
          >
            {hasSuggested ? suggestion.suggested : t('analysis.popover.removeText')}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onReject?.(suggestion)}
            className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 font-medium transition-colors text-xs disabled:opacity-60"
          >
            {isUnappliable ? t('analysis.popover.close') : t('analysis.popover.reject')}
          </button>
          {!isUnappliable ? (
            <button
              type="button"
              disabled={isLoading}
              onClick={() => onAccept?.(suggestion)}
              className="flex-1 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors text-xs shadow-sm disabled:opacity-60"
            >
              {t('analysis.popover.accept')}
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
