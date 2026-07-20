import { useEffect, useRef } from 'react';
import AppIcon from '../../../components/icons/AppIcon';

const TOOLBAR_BUTTONS = [
  { command: 'bold', icon: 'format_bold', label: 'Bold' },
  { command: 'italic', icon: 'format_italic', label: 'Italic' },
  { command: 'underline', icon: 'format_underlined', label: 'Underline' },
  { command: 'insertUnorderedList', icon: 'format_list_bulleted', label: 'Bullet list' },
  { command: 'createLink', icon: 'link', label: 'Link', prompt: true },
  { command: 'justifyLeft', icon: 'format_align_left', label: 'Align left' },
  { command: 'justifyCenter', icon: 'format_align_center', label: 'Align center' },
  { command: 'justifyRight', icon: 'format_align_right', label: 'Align right' },
  { command: 'justifyFull', icon: 'format_align_justify', label: 'Justify' },
];

export default function RichTextEditor({ value, onChange, placeholder = '' }) {
  const editorRef = useRef(null);
  const savedRangeRef = useRef(null);
  const isInternalUpdateRef = useRef(false);
  const lastExternalValueRef = useRef(value || '');

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }

    const nextValue = value || '';
    const currentHtml = editor.innerHTML;

    if (nextValue !== lastExternalValueRef.current || (!currentHtml && nextValue)) {
      editor.innerHTML = nextValue;
      lastExternalValueRef.current = nextValue;
    }
  }, [value]);

  const saveSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) {
      savedRangeRef.current = range.cloneRange();
    }
  };

  const restoreSelection = () => {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || !savedRangeRef.current) return;

    selection.removeAllRanges();
    selection.addRange(savedRangeRef.current);
  };

  const syncValue = () => {
    const editor = editorRef.current;
    if (!editor) return;

    const html = editor.innerHTML;
    isInternalUpdateRef.current = true;
    lastExternalValueRef.current = html;
    onChange(html);
  };

  const runCommand = (command) => {
    const editor = editorRef.current;
    if (!editor) return;

    editor.focus();
    restoreSelection();

    if (command === 'createLink') {
      const url = window.prompt('Enter URL');
      if (!url) return;
      const trimmed = url.trim();
      const lower = trimmed.toLowerCase();
      if (
        lower.startsWith('javascript:') ||
        lower.startsWith('data:') ||
        lower.startsWith('vbscript:')
      ) {
        return;
      }
      const safeUrl =
        /^https?:\/\//i.test(trimmed) || trimmed.startsWith('mailto:')
          ? trimmed
          : `https://${trimmed}`;
      document.execCommand(command, false, safeUrl);
    } else {
      document.execCommand(command, false, null);
    }

    saveSelection();
    syncValue();
  };

  return (
    <div className="rounded-xl border border-outline-variant overflow-hidden">
      <div className="flex flex-wrap items-center gap-1 border-b border-outline-variant/40 bg-surface-container-low px-2 py-2">
        {TOOLBAR_BUTTONS.map((button) => (
          <button
            key={button.command}
            type="button"
            onMouseDown={(event) => {
              event.preventDefault();
              runCommand(button.command);
            }}
            className="p-1.5 rounded-md text-on-surface-variant hover:bg-white hover:text-secondary transition-colors"
            aria-label={button.label}
            title={button.label}
          >
            <AppIcon name={button.icon} size="button" className="text-on-surface-variant" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        className="min-h-[140px] px-md py-sm font-body-md text-on-surface outline-none prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        data-placeholder={placeholder}
        onInput={() => {
          saveSelection();
          syncValue();
        }}
        onBlur={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        onFocus={saveSelection}
      />
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: #76777d;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}
