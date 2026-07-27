import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import sanitizeHtml from '../../../utils/sanitizeHtml';
import { buildAnnotatedHtml, extractPlainText } from '../utils/resumeEditorUtils';
import SuggestionPopover from './SuggestionPopover';

export default function ResumeEditor({
  resumeText = '',
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
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);
  const isComposingRef = useRef(false);
  const hasMountedRef = useRef(false);

  const annotatedHtml = useMemo(
    () => sanitizeHtml(buildAnnotatedHtml(resumeText, suggestions)),
    [resumeText, suggestions]
  );

  const pendingSuggestions = useMemo(
    () => suggestions.filter((item) => item.status === 'pending'),
    [suggestions]
  );

  useEffect(() => {
    lastSavedTextRef.current = resumeText;
  }, [resumeText]);

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
    const nextText = extractPlainText(editorRef.current);
    scheduleSave(nextText);
  };

  const handleSuggestionClick = (event) => {
    const target = event.target.closest('[data-suggestion-id]');
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();

    const suggestionId = target.getAttribute('data-suggestion-id');
    const suggestion = pendingSuggestions.find((item) => item.id === suggestionId);
    if (!suggestion) return;

    setSelectedSuggestion(suggestion);
    setAnchorRect(target.getBoundingClientRect());
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

      <footer className="px-md py-sm border-t border-outline-variant/30">
        <p className="font-body-sm text-on-surface-variant">
          {t('analysis.editor.hint', { count: pendingSuggestions.length })}
        </p>
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
