import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { cn } from '../../../lib/utils';

const ACCEPT = '.pdf,.docx';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export default function ResumeUploadPanel({
  activeTab,
  onTabChange,
  selectedFile,
  onFileSelect,
  savedResumes = [],
  savedLoading = false,
  selectedSavedResume,
  onSelectSavedResume,
  fileError = '',
}) {
  const { t } = useTranslation('resumeScanner');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const validateAndSelect = (file) => {
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx'].includes(extension || '')) {
      onFileSelect(null, t('upload.errors.unsupportedFile'));
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onFileSelect(null, t('upload.errors.fileTooLarge'));
      return;
    }

    onFileSelect(file, '');
  };

  return (
    <section className="dashboard-glass-card rounded-2xl p-md flex flex-col min-h-[500px]">
      <header className="mb-sm">
        <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-xs">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10 text-secondary text-sm font-bold">
            1
          </span>
          {t('upload.step1Title')}
        </h3>
      </header>

      <div className="flex gap-4 border-b border-outline-variant mb-md font-label-md text-label-md">
        {[
          { id: 'upload', label: t('upload.tabs.uploadNew') },
          { id: 'saved', label: t('upload.tabs.savedResumes') },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'pb-2 border-b-2 transition-colors',
              activeTab === tab.id
                ? 'border-secondary text-secondary font-bold'
                : 'border-transparent text-on-surface-variant hover:text-primary'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'upload' ? (
        <div className="flex-1 flex flex-col">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              validateAndSelect(event.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex-1 flex flex-col justify-center items-center border-2 border-dashed rounded-xl bg-surface hover:bg-surface-container transition-all cursor-pointer group p-lg relative overflow-hidden',
              dragOver ? 'border-secondary/70 bg-secondary/5' : 'border-outline-variant hover:border-secondary/50'
            )}
          >
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, #0058be 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="w-16 h-16 rounded-full bg-surface-container-highest flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10">
              <AppIcon name="upload_file" size="h-8 w-8" className="text-secondary" />
            </div>
            <p className="font-headline-md text-headline-md text-primary mb-1 relative z-10">
              {t('upload.dropzoneTitle')}
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mb-4 relative z-10">
              {t('upload.dropzoneHint')}
            </p>
            <div className="flex gap-2 font-label-sm text-label-sm text-on-surface-variant/80 relative z-10">
              <span className="bg-surface-container px-2 py-1 rounded-md">{t('upload.formats.pdf')}</span>
              <span className="bg-surface-container px-2 py-1 rounded-md">{t('upload.formats.docx')}</span>
              <span className="bg-surface-container px-2 py-1 rounded-md">{t('upload.formats.maxSize')}</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(event) => {
                validateAndSelect(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
          </div>

          {selectedFile ? (
            <div className="mt-md flex items-center justify-between gap-sm rounded-xl border border-outline-variant/50 bg-surface-container-low px-md py-sm">
              <p className="font-body-md text-on-surface truncate">
                {t('upload.selectedFile', { name: selectedFile.name })}
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="font-label-sm text-secondary hover:underline shrink-0"
              >
                {t('upload.changeFile')}
              </button>
            </div>
          ) : null}

          {fileError ? (
            <p className="mt-sm font-body-sm text-error" role="alert">
              {fileError}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-sm pe-1">
          {savedLoading ? (
            <p className="font-body-md text-on-surface-variant">{t('page.analysisPlaceholder.loading')}</p>
          ) : null}

          {!savedLoading && savedResumes.length === 0 ? (
            <p className="font-body-md text-on-surface-variant">{t('upload.savedEmpty')}</p>
          ) : null}

          {savedResumes.map((resume) => {
            const isSelected = selectedSavedResume?.id === resume.id;
            return (
              <button
                key={`${resume.sourceType}-${resume.id}`}
                type="button"
                onClick={() => onSelectSavedResume(resume)}
                className={cn(
                  'w-full text-start rounded-xl border px-md py-sm transition-colors',
                  isSelected
                    ? 'border-secondary bg-secondary/10'
                    : 'border-outline-variant/50 hover:border-secondary/40 hover:bg-surface-container-low'
                )}
              >
                <div className="flex items-center justify-between gap-sm">
                  <div className="min-w-0">
                    <p className="font-body-md text-on-surface truncate">{resume.label}</p>
                    <p className="font-label-sm text-on-surface-variant mt-0.5">
                      {resume.sourceType === 'built'
                        ? t('upload.savedBuilt')
                        : t('upload.savedScanned')}
                      {' · '}
                      {t('upload.updatedAt', {
                        date: new Date(resume.updatedAt).toLocaleDateString(),
                      })}
                    </p>
                  </div>
                  {isSelected ? (
                    <AppIcon name="check_circle" size="h-5 w-5" className="text-secondary shrink-0" />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
