import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import ResumeModal from './ResumeModal';

const ACCEPT = '.pdf,.docx';

export default function ImportResumeModal({
  open,
  onClose,
  onImportFile,
  onImportPaste,
}) {
  const { t } = useTranslation('resumeBuilder');
  const [tab, setTab] = useState('file');
  const [pastedText, setPastedText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    onImportFile(file);
  };

  const footer =
    tab === 'paste' ? (
      <button
        type="button"
        disabled={!pastedText.trim()}
        onClick={() => onImportPaste(pastedText)}
        className="w-full rounded-xl bg-secondary py-sm font-label-md text-white hover:bg-secondary-container transition-colors disabled:opacity-50"
      >
        {t('import.importPasted')}
      </button>
    ) : null;

  return (
    <ResumeModal open={open} onClose={onClose} title={t('import.title')} size="lg" footer={footer}>
      <div className="p-lg space-y-md">
        <div className="flex gap-2 border-b border-outline-variant/40">
          {[
            { id: 'file', labelKey: 'import.tabs.file' },
            { id: 'paste', labelKey: 'import.tabs.paste' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`px-md py-sm font-label-md border-b-2 transition-colors ${
                tab === item.id
                  ? 'border-secondary text-secondary'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        {tab === 'file' ? (
          <>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(false);
                handleFile(event.dataTransfer.files?.[0]);
              }}
              className={`rounded-2xl border-2 border-dashed px-lg py-xl text-center transition-colors ${
                dragOver ? 'border-secondary bg-secondary/5' : 'border-outline-variant'
              }`}
            >
              <AppIcon
                name="upload_file"
                size="h-10 w-10"
                className="text-on-surface-variant mb-sm"
              />
              <p className="font-body-md text-on-surface mb-xs">{t('import.dropzoneTitle')}</p>
              <p className="font-body-sm text-on-surface-variant mb-md">{t('import.dropzoneHint')}</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl bg-secondary px-md py-sm font-label-md text-white hover:bg-secondary-container transition-colors"
              >
                {t('import.selectFile')}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(event) => {
                  handleFile(event.target.files?.[0]);
                  event.target.value = '';
                }}
              />
            </div>
          </>
        ) : (
          <textarea
            value={pastedText}
            onChange={(event) => setPastedText(event.target.value)}
            rows={12}
            placeholder={t('import.pastePlaceholder')}
            className="w-full rounded-xl border border-outline-variant px-md py-sm font-body-md outline-none focus:border-secondary"
          />
        )}
      </div>
    </ResumeModal>
  );
}
