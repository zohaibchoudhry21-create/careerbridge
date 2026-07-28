import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import sanitizeHtml from '../../../utils/sanitizeHtml';
import {
  buildAnnotatedHtml,
  extractPlainText,
  partitionSuggestions,
  resolveResumeDisplayText,
} from '../utils/resumeEditorUtils';
import SuggestionPopover from './SuggestionPopover';
import { cn } from '../../../lib/utils';

export default function ResumeEditor({
  resumeText = '',
  lineMap = [],
  suggestions = [],
  onTextChange,
  onSuggestionAction,
  isSaving = false,
  isSuggestionLoading = false,
}) {
  const { t } = useTranslation('resumeScanner');
  const editorRef = useRef(null);
  const saveTimerRef = useRef(null);
  const lastSavedTextRef = useRef(resumeText);
  const userEditedRef = useRef(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const isComposingRef = useRef(false);
  const hasMountedRef = useRef(false);

  const displayText = useMemo(
    () => resolveResumeDisplayText({ resumeText, lineMap }),
    [resumeText, lineMap]
  );

  const { pending, unanchored } = useMemo(() => partitionSuggestions(suggestions), [suggestions]);

  const annotatedHtml = useMemo(
    () => sanitizeHtml(buildAnnotatedHtml(displayText, suggestions, lineMap)),
    [displayText, suggestions, lineMap]
  );

  useEffect(() => {
    lastSavedTextRef.current = displayText;
    userEditedRef.current = false;
  }, [displayText]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (!hasMountedRef.current) {
      editorRef.current.innerHTML = annotatedHtml;
      hasMountedRef.current = true;
      return;
    }
    if (document.activeElement === editorRef.current) return;

    editorRef.current.innerHTML = annotatedHtml;
  }, [annotatedHtml]);

  const scheduleSave = useCallback(
    (nextText) => {
      if (!userEditedRef.current) return;

      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        if (nextText !== lastSavedTextRef.current) {
          onTextChange?.(nextText);
        }
      }, 700);
    },
    [onTextChange]
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    },
    []
  );

  const handleInput = () => {
    if (isComposingRef.current || !editorRef.current) return;
    userEditedRef.current = true;
    const nextText = extractPlainText(editorRef.current);
    scheduleSave(nextText);
  };

  const openSuggestion = (suggestion, target) => {
    setSelectedSuggestion(suggestion);
    setAnchorRect(target?.getBoundingClientRect?.() || null);
  };

  const handleSuggestionClick = (event) => {
    const target = event.target.closest('[data-suggestion-id]');
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();

    const suggestionId = target.getAttribute('data-suggestion-id');
    const suggestion = pending.find((item) => item.id === suggestionId);
    if (!suggestion) return;

    openSuggestion(suggestion, target);
  };

  const closePopover = () => {
    setSelectedSuggestion(null);
    setAnchorRect(null);
  };

  const handleSuggestionDecision = async (suggestion, action) => {
    await onSuggestionAction?.(suggestion, action);
    closePopover();
  };

  return (
    <section className="dashboard-glass-card rounded-2xl flex flex-col min-h-[520px] overflow-hidden">
      <header className="px-md py-sm border-b border-outline-variant/30 flex items-center justify-between gap-2">
        <h2 className="font-label-md text-on-surface">{t('analysis.editor.title')}</h2>
        {isSaving ? (
          <span className="font-label-sm text-on-surface-variant">{t('analysis.editor.saving')}</span>
        ) : null}
      </header>

      <div className="flex-1 overflow-y-auto p-md">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          aria-label={t('analysis.editor.ariaLabel')}
          className="min-h-[420px] whitespace-pre-wrap font-body-md text-on-surface leading-relaxed outline-none focus:ring-2 focus:ring-secondary/30 rounded-lg p-sm"
          onInput={handleInput}
          onClick={handleSuggestionClick}
          onCompositionStart={() => {
            isComposingRef.current = true;
          }}
          onCompositionEnd={() => {
            isComposingRef.current = false;
            handleInput();
          }}
        />
      </div>

      <footer className="px-md py-sm border-t border-outline-variant/30 space-y-sm">
        <p className="font-body-sm text-on-surface-variant">
          {t('analysis.editor.hint', { count: pending.length })}
        </p>

        {unanchored.length ? (
          <div className="space-y-2" data-ats-chrome="true">
            <p className="font-label-sm text-on-surface-variant">{t('analysis.editor.unanchoredTitle')}</p>
            <div className="flex flex-wrap gap-2">
              {unanchored.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  data-ats-chrome="true"
                  className={cn(
                    'ats-suggestion-chip rounded-full border border-outline-variant/50 px-3 py-1 font-label-sm text-on-surface hover:border-secondary hover:text-secondary transition-colors'
                  )}
                  onClick={(event) => openSuggestion(suggestion, event.currentTarget)}
                >
                  {t(`analysis.suggestionTypes.${suggestion.type}`)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </footer>

      <AnimatePresence>
        {selectedSuggestion ? (
          <SuggestionPopover
            suggestion={selectedSuggestion}
            anchorRect={anchorRect}
            isLoading={isSuggestionLoading}
            onClose={closePopover}
            onAccept={(suggestion) => handleSuggestionDecision(suggestion, 'accept')}
            onReject={(suggestion) => handleSuggestionDecision(suggestion, 'reject')}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}
