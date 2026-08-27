import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import SuggestionPopover from './SuggestionPopover';
import {
  annotateFieldHtml,
  cloneStructuredResume,
  hasStructuredResumeData,
  updateField,
} from '../utils/structuredResumeUtils';
import { partitionSuggestions } from '../utils/resumeEditorUtils';
import { DEFAULT_TEMPLATE } from '../../resumeBuilder/components/templatesConfig';
import { cn } from '../../../lib/utils';

// TODO: Map templateId to per-template Edit chrome (modern sidebar, professional header, etc.).
// For now all templateIds use Classic-style chrome so diffs stay readable on a white serif page.
const HEADING_CLASS =
  'text-xs font-bold tracking-widest text-on-surface uppercase border-b border-outline-variant pb-1 mb-3 mt-7';
const LINE_CLASS = 'ats-section-line outline-none text-xs leading-relaxed text-on-surface';
const BULLET_CLASS =
  'ats-section-line ats-bullet-line pl-5 outline-none text-xs leading-relaxed text-on-surface';

const EditableLine = ({
  path,
  value = '',
  suggestions = [],
  suggestionsEnabled,
  bullet = false,
  className,
  onFieldChange,
  onSuggestionClick,
}) => {
  const ref = useRef(null);
  const composingRef = useRef(false);
  const lastExternalRef = useRef(value);

  const html = useMemo(
    () => annotateFieldHtml(value, path, suggestions, suggestionsEnabled),
    [value, path, suggestions, suggestionsEnabled]
  );

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (lastExternalRef.current === value && ref.current.getAttribute('data-synced') === '1') {
      // still refresh highlights when suggestions change while not focused
    }
    ref.current.innerHTML = html || '<br>';
    ref.current.setAttribute('data-synced', '1');
    lastExternalRef.current = value;
  }, [html, value]);

  const emit = () => {
    if (!ref.current || composingRef.current) return;
    const next = (ref.current.innerText || '').replace(/\u00a0/g, ' ').trimEnd();
    if (next === lastExternalRef.current) return;
    lastExternalRef.current = next;
    onFieldChange?.(path, next);
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      data-field-path={path}
      className={cn(bullet ? BULLET_CLASS : LINE_CLASS, className)}
      onInput={emit}
      onBlur={emit}
      onClick={onSuggestionClick}
      onCompositionStart={() => {
        composingRef.current = true;
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
        emit();
      }}
    />
  );
};

const ResumeEditor = forwardRef(function ResumeEditor(
  {
    structuredResume = null,
    suggestions = [],
    templateId = DEFAULT_TEMPLATE,
    onStructuredChange,
    onStructuredPreview,
    onSuggestionAction,
    isSaving = false,
    isSuggestionLoading = false,
    suggestionsEnabled = true,
  },
  ref
) {
  const { t } = useTranslation('resumeScanner');
  const [local, setLocal] = useState(() => cloneStructuredResume(structuredResume));
  const pendingRef = useRef(null);
  const saveTimerRef = useRef(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [anchorRect, setAnchorRect] = useState(null);

  const cancelPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingRef.current = null;
  }, []);

  useEffect(() => {
    if (!hasStructuredResumeData(structuredResume)) return;
    cancelPendingSave();
    setLocal(cloneStructuredResume(structuredResume));
  }, [structuredResume, cancelPendingSave]);

  const { pending, unanchored } = useMemo(() => partitionSuggestions(suggestions), [suggestions]);
  const unappliable = useMemo(
    () => suggestions.filter((item) => item.status === 'unappliable'),
    [suggestions]
  );

  const focusFieldPath = (path) => {
    if (!path) return;
    const el = document.querySelector(`[data-field-path="${path}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus?.();
    }
  };

  /** Cancels the debounce and hands the unsaved draft to the caller, which owns the save. */
  const flushPendingSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!pendingRef.current) return null;
    const next = pendingRef.current;
    pendingRef.current = null;
    return next;
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      flushPendingSave,
      cancelPendingSave,
    }),
    [flushPendingSave, cancelPendingSave]
  );

  useEffect(
    () => () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    },
    []
  );

  const handleFieldChange = useCallback(
    (path, value) => {
      setLocal((prev) => {
        const next = updateField(prev, path, value);
        pendingRef.current = next;
        onStructuredPreview?.(next);
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
          saveTimerRef.current = null;
          const payload = pendingRef.current;
          pendingRef.current = null;
          if (payload) onStructuredChange?.(payload);
        }, 700);
        return next;
      });
    },
    [onStructuredChange, onStructuredPreview]
  );

  const openSuggestion = (suggestion, target) => {
    if (!suggestionsEnabled) return;
    cancelPendingSave();
    setSelectedSuggestion(suggestion);
    setAnchorRect(target?.getBoundingClientRect?.() || null);
  };

  const handleSuggestionClick = (event) => {
    if (!suggestionsEnabled) return;
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
    cancelPendingSave();
    await onSuggestionAction?.(suggestion, action);
    closePopover();
  };

  const contactLine = [local.contact.email, local.contact.phone, local.contact.address]
    .filter(Boolean)
    .join(' | ');

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-12 flex justify-center bg-slate-50 min-h-0">
      <div className="w-full max-w-[800px]">
        {isSaving ? (
          <p className="text-xs text-slate-400 mb-2 text-end">{t('analysis.editor.saving')}</p>
        ) : null}

        <div
          // TODO: Map templateId to per-template Edit chrome (modern sidebar, etc.). Classic chrome for all ids for now.
          data-template-id={templateId}
          data-edit-chrome="classic"
          className={cn(
            'resume-paper resume-document w-full bg-white shadow-lg p-8 lg:p-10',
            'min-h-[1000px] whitespace-pre-wrap outline-none text-sm leading-relaxed font-serif text-on-surface',
            'focus-within:ring-4 focus-within:ring-blue-100 transition-shadow'
          )}
          aria-label={t('analysis.editor.ariaLabel')}
        >
          <div className="text-center border-b border-outline-variant pb-4 mb-5">
            <EditableLine
              path="name"
              value={local.name}
              suggestions={suggestions}
              suggestionsEnabled={suggestionsEnabled}
              className="text-2xl font-bold tracking-wide uppercase text-on-surface text-center"
              onFieldChange={handleFieldChange}
              onSuggestionClick={handleSuggestionClick}
            />

            <EditableLine
              path="contact.email"
              value={contactLine}
              suggestions={suggestions}
              suggestionsEnabled={suggestionsEnabled}
              className="mt-1 text-xs text-on-surface-variant text-center"
              onFieldChange={(_path, value) => {
                  // Keep contact as a single visual line; store into email for simplicity when free-edited
                  // Prefer structured fields when pipe-separated
                  const parts = String(value || '')
                    .split('|')
                    .map((p) => p.trim())
                    .filter(Boolean);
                  let next = local;
                  if (parts.length >= 1) next = updateField(next, 'contact.email', parts[0] || '');
                  if (parts.length >= 2) next = updateField(next, 'contact.phone', parts[1] || '');
                  if (parts.length >= 3) next = updateField(next, 'contact.address', parts.slice(2).join(' | '));
                  if (parts.length === 0) {
                    next = updateField(next, 'contact.email', '');
                    next = updateField(next, 'contact.phone', '');
                    next = updateField(next, 'contact.address', '');
                  }
                  setLocal(next);
                  pendingRef.current = next;
                  if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                  saveTimerRef.current = setTimeout(() => {
                    saveTimerRef.current = null;
                    const payload = pendingRef.current;
                    pendingRef.current = null;
                    if (payload) onStructuredChange?.(payload);
                  }, 700);
                }}
              onSuggestionClick={handleSuggestionClick}
            />
          </div>

          <div className={HEADING_CLASS} contentEditable={false}>
            PROFESSIONAL SUMMARY
          </div>
          <EditableLine
            path="summary"
            value={local.summary}
            suggestions={suggestions}
            suggestionsEnabled={suggestionsEnabled}
            onFieldChange={handleFieldChange}
            onSuggestionClick={handleSuggestionClick}
          />

          {local.workExperience.length ? (
            <>
              <div className={HEADING_CLASS} contentEditable={false}>
                WORK EXPERIENCE
              </div>
              {local.workExperience.map((job, i) => (
                <div key={`job-${i}`} className="mb-1">
                  <EditableLine
                    path={`workExperience.${i}.title`}
                    value={[job.title, job.company].filter(Boolean).join(', ')}
                    suggestions={suggestions}
                    suggestionsEnabled={suggestionsEnabled}
                    onFieldChange={(_path, value) => {
                      const parts = String(value || '').split(/\s*,\s*/);
                      let next = updateField(local, `workExperience.${i}.title`, parts[0] || '');
                      next = updateField(next, `workExperience.${i}.company`, parts.slice(1).join(', '));
                      setLocal(next);
                      pendingRef.current = next;
                      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                      saveTimerRef.current = setTimeout(() => {
                        saveTimerRef.current = null;
                        const payload = pendingRef.current;
                        pendingRef.current = null;
                        if (payload) onStructuredChange?.(payload);
                      }, 700);
                    }}
                    onSuggestionClick={handleSuggestionClick}
                  />
                  <EditableLine
                    path={`workExperience.${i}.duration`}
                    value={job.duration}
                    suggestions={suggestions}
                    suggestionsEnabled={suggestionsEnabled}
                    onFieldChange={handleFieldChange}
                    onSuggestionClick={handleSuggestionClick}
                  />
                  {job.bullets.map((bullet, j) => (
                    <EditableLine
                      key={`bullet-${i}-${j}`}
                      path={`workExperience.${i}.bullets.${j}`}
                      value={bullet.startsWith('•') || bullet.startsWith('-') ? bullet : `• ${bullet}`}
                      bullet
                      suggestions={suggestions}
                      suggestionsEnabled={suggestionsEnabled}
                      onFieldChange={(path, value) => {
                        const cleaned = String(value || '').replace(/^[-•*]\s*/, '').trim();
                        handleFieldChange(path, cleaned);
                      }}
                      onSuggestionClick={handleSuggestionClick}
                    />
                  ))}
                </div>
              ))}
            </>
          ) : null}

          {local.education.length ? (
            <>
              <div className={HEADING_CLASS} contentEditable={false}>
                EDUCATION
              </div>
              {local.education.map((ed, i) => (
                <div key={`edu-${i}`}>
                  <EditableLine
                    path={`education.${i}.degree`}
                    value={[ed.degree, ed.institution].filter(Boolean).join(', ')}
                    suggestions={suggestions}
                    suggestionsEnabled={suggestionsEnabled}
                    onFieldChange={(_path, value) => {
                      const parts = String(value || '').split(/\s*,\s*/);
                      let next = updateField(local, `education.${i}.degree`, parts[0] || '');
                      next = updateField(next, `education.${i}.institution`, parts.slice(1).join(', '));
                      setLocal(next);
                      pendingRef.current = next;
                      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
                      saveTimerRef.current = setTimeout(() => {
                        saveTimerRef.current = null;
                        const payload = pendingRef.current;
                        pendingRef.current = null;
                        if (payload) onStructuredChange?.(payload);
                      }, 700);
                    }}
                    onSuggestionClick={handleSuggestionClick}
                  />
                  <EditableLine
                    path={`education.${i}.duration`}
                    value={ed.duration}
                    suggestions={suggestions}
                    suggestionsEnabled={suggestionsEnabled}
                    onFieldChange={handleFieldChange}
                    onSuggestionClick={handleSuggestionClick}
                  />
                </div>
              ))}
            </>
          ) : null}

          {local.skills.length ? (
            <>
              <div className={HEADING_CLASS} contentEditable={false}>
                SKILLS
              </div>
              <EditableLine
                path="skills"
                value={local.skills.join(', ')}
                suggestions={suggestions}
                suggestionsEnabled={suggestionsEnabled}
                onFieldChange={(_path, value) => {
                  const skills = String(value || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  handleFieldChange('skills', skills);
                }}
                onSuggestionClick={handleSuggestionClick}
              />
            </>
          ) : null}

          {local.languages.length ? (
            <>
              <div className={HEADING_CLASS} contentEditable={false}>
                LANGUAGES
              </div>
              <EditableLine
                path="languages"
                value={local.languages.join(', ')}
                suggestions={suggestions}
                suggestionsEnabled={suggestionsEnabled}
                onFieldChange={(_path, value) => {
                  const languages = String(value || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean);
                  handleFieldChange('languages', languages);
                }}
                onSuggestionClick={handleSuggestionClick}
              />
            </>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs text-slate-400">
            {suggestionsEnabled
              ? t('analysis.editor.hint', { count: pending.length })
              : t('analysis.editor.editHint')}
          </p>

          {suggestionsEnabled && unappliable.length ? (
            <div className="space-y-2" data-ats-chrome="true">
              <p className="text-xs font-semibold text-amber-700">{t('analysis.editor.unappliableTitle')}</p>
              <p className="text-xs text-slate-500">{t('analysis.editor.unappliableHint')}</p>
              <div className="flex flex-wrap gap-2">
                {unappliable.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    data-ats-chrome="true"
                    className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-800 hover:border-amber-400 transition-colors"
                    onClick={(event) => {
                      if (suggestion.fieldPath) focusFieldPath(suggestion.fieldPath);
                      openSuggestion(suggestion, event.currentTarget);
                    }}
                  >
                    {t('analysis.popover.unappliable')}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {suggestionsEnabled && unanchored.length ? (
            <div className="space-y-2" data-ats-chrome="true">
              <p className="text-xs text-slate-500">{t('analysis.editor.unanchoredTitle')}</p>
              <div className="flex flex-wrap gap-2">
                {unanchored.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    data-ats-chrome="true"
                    className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700 hover:border-blue-600 hover:text-blue-600 transition-colors bg-white"
                    onClick={(event) => openSuggestion(suggestion, event.currentTarget)}
                  >
                    {t(`analysis.suggestionTypes.${suggestion.type}`)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {suggestionsEnabled && selectedSuggestion ? (
          <SuggestionPopover
            layout="floating"
            suggestion={selectedSuggestion}
            anchorRect={anchorRect}
            isLoading={isSuggestionLoading}
            onClose={closePopover}
            onAccept={(suggestion) => handleSuggestionDecision(suggestion, 'accept')}
            onReject={(suggestion) => handleSuggestionDecision(suggestion, 'reject')}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
});

export default ResumeEditor;
