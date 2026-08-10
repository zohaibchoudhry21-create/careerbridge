import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Bot,
  Italic,
  Link2,
  List,
  Loader2,
  Underline,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import { resolveApiError } from '../../../utils/apiError';
import { sanitizeHtml } from '../../../utils/sanitizeHtml';
import { stripHtml } from '../utils/resumeEditorUtils';

const TOOLBAR_BTN =
  'inline-flex h-8 w-8 items-center justify-center rounded-md text-on-surface-variant hover:bg-surface-container hover:text-secondary disabled:opacity-40';

export const toEditorHtml = (value = '') => {
  const raw = String(value || '');
  if (!raw.trim()) return '';
  if (/<[a-z][\s\S]*>/i.test(raw)) return sanitizeHtml(raw);
  return sanitizeHtml(
    raw
      .split(/\n{2,}/)
      .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
      .join('')
  );
};

function ToolbarButton({ label, active, disabled, onMouseDown, children }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={onMouseDown}
      className={cn(TOOLBAR_BTN, active && 'bg-secondary/10 text-secondary')}
    >
      {children}
    </button>
  );
}

/**
 * Shared rich-text field + AI action pills for resume builder entries.
 */
export default function RichTextAiField({
  label,
  placeholder,
  value = '',
  onChange,
  onAiAction,
  disabled = false,
  showSuggestPill = false,
  aiContext = null,
}) {
  const { t } = useTranslation('resumeBuilder');
  const editorRef = useRef(null);
  const skipSyncRef = useRef(false);
  const [aiBusy, setAiBusy] = useState(null);
  const [isEmpty, setIsEmpty] = useState(() => !stripHtml(value));

  useEffect(() => {
    if (!editorRef.current || skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const next = toEditorHtml(value);
    if (editorRef.current.innerHTML !== next) {
      editorRef.current.innerHTML = next || '';
    }
    setIsEmpty(!stripHtml(value));
  }, [value]);

  const emitChange = () => {
    if (!editorRef.current) return;
    skipSyncRef.current = true;
    const html = editorRef.current.innerHTML;
    const plain = stripHtml(html);
    setIsEmpty(!plain);
    onChange?.(plain ? html : '');
  };

  const runCommand = (command, commandValue = null) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    emitChange();
  };

  const handleLink = () => {
    const url = window.prompt(t('richText.enterUrl'), 'https://');
    if (!url) return;
    runCommand('createLink', url);
  };

  const runAi = async (action) => {
    if (!onAiAction) return;
    const content = editorRef.current?.innerHTML || value || '';
    if (action !== 'suggest' && action !== 'tips' && !stripHtml(content)) {
      toast.error(t('editEntry.contentRequired'));
      return;
    }

    setAiBusy(action);
    try {
      const result = await onAiAction(action, content, aiContext);
      const text = result?.text || '';
      const html = toEditorHtml(text);
      if (editorRef.current) editorRef.current.innerHTML = html;
      skipSyncRef.current = true;
      setIsEmpty(!stripHtml(html));
      onChange?.(html);
      toast.success(t('editEntry.aiApplied'));
    } catch (error) {
      toast.error(resolveApiError(error, t('toasts.aiUnavailable')));
    } finally {
      setAiBusy(null);
    }
  };

  const busy = disabled || Boolean(aiBusy);

  const pills = [
    { action: 'improve', label: t('aiActions.improve') },
    ...(showSuggestPill ? [{ action: 'suggest', label: t('aiActions.suggest') }] : []),
    { action: 'grammar', label: t('aiActions.grammar') },
    { action: 'shorter', label: t('aiActions.shorter') },
  ];

  return (
    <div>
      {label ? <p className="text-sm font-medium text-on-surface mb-2">{label}</p> : null}

      <div className="rounded-xl border border-outline-variant bg-surface-container-low overflow-hidden">
        <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-outline-variant bg-surface-container-lowest">
          <ToolbarButton label={t('richText.bold')} disabled={busy} onMouseDown={(e) => { e.preventDefault(); runCommand('bold'); }}>
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label={t('richText.italic')} disabled={busy} onMouseDown={(e) => { e.preventDefault(); runCommand('italic'); }}>
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label={t('richText.underline')} disabled={busy} onMouseDown={(e) => { e.preventDefault(); runCommand('underline'); }}>
            <Underline className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label={t('richText.bulletList')} disabled={busy} onMouseDown={(e) => { e.preventDefault(); runCommand('insertUnorderedList'); }}>
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label={t('richText.link')} disabled={busy} onMouseDown={(e) => { e.preventDefault(); handleLink(); }}>
            <Link2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <span className="mx-1 h-4 w-px bg-outline-variant" aria-hidden />
          <ToolbarButton label={t('richText.alignLeft')} disabled={busy} onMouseDown={(e) => { e.preventDefault(); runCommand('justifyLeft'); }}>
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label={t('richText.alignCenter')} disabled={busy} onMouseDown={(e) => { e.preventDefault(); runCommand('justifyCenter'); }}>
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label={t('richText.alignRight')} disabled={busy} onMouseDown={(e) => { e.preventDefault(); runCommand('justifyRight'); }}>
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton label={t('richText.justify')} disabled={busy} onMouseDown={(e) => { e.preventDefault(); runCommand('justifyFull'); }}>
            <AlignJustify className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        <div className="relative">
          {isEmpty ? (
            <p className="pointer-events-none absolute inset-x-3 top-2.5 text-sm text-on-surface-variant/70">
              {placeholder}
            </p>
          ) : null}
          <div
            ref={editorRef}
            contentEditable={!busy}
            suppressContentEditableWarning
            role="textbox"
            aria-multiline="true"
            aria-label={label || placeholder}
            onInput={emitChange}
            onBlur={emitChange}
            className="relative min-h-[120px] max-h-[260px] overflow-y-auto px-3 py-2.5 text-sm text-on-surface leading-relaxed outline-none"
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <Bot className="h-4 w-4" />
        </span>
        {pills.map(({ action, label: pillLabel }) => (
          <button
            key={action}
            type="button"
            disabled={busy}
            onClick={() => runAi(action)}
            className="inline-flex items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary-fixed px-3 py-1.5 text-xs font-medium text-on-secondary-fixed-variant hover:bg-secondary/10 disabled:opacity-50"
          >
            {aiBusy === action ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            {aiBusy === action ? t('aiActions.working') : pillLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
