import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import { buttonPrimaryClass } from '../../../components/ui/buttonTokens';
import { cn } from '../../../lib/utils';

export default function JobDescriptionPanel({
  jobDescription,
  onJobDescriptionChange,
  onClear,
  onAnalyze,
  isAnalyzing = false,
}) {
  const { t } = useTranslation('resumeScanner');

  return (
    <section className="dashboard-glass-card rounded-2xl p-md flex flex-col min-h-[500px] relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-secondary via-[#8b5cf6] to-secondary opacity-50" />

      <header className="mb-md flex justify-between items-center gap-sm">
        <h3 className="font-headline-md text-headline-md text-primary flex items-center gap-xs">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-secondary/10 text-secondary text-sm font-bold">
            2
          </span>
          {t('upload.step2Title')}
        </h3>
        <button
          type="button"
          onClick={onClear}
          className="text-secondary font-label-sm text-label-sm hover:underline"
        >
          {t('upload.clearText')}
        </button>
      </header>

      <div className="flex-1 flex flex-col relative group">
        <textarea
          value={jobDescription}
          onChange={(event) => onJobDescriptionChange(event.target.value)}
          placeholder={t('upload.jobDescriptionPlaceholder')}
          className="w-full flex-1 min-h-[320px] bg-surface-container-low text-on-surface border-none rounded-xl p-sm resize-none focus:ring-2 focus:ring-secondary/50 focus:bg-surface-container-lowest transition-all outline-none font-body-md text-body-md placeholder:text-outline/70 shadow-inner"
        />
        <div className="absolute bottom-4 end-4 flex items-center gap-2 text-outline-variant font-label-sm text-label-sm bg-surface-container-lowest/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-outline-variant/30 pointer-events-none">
          <AppIcon name="rate_review" size="h-4 w-4" />
          {t('upload.pasteHint')}
        </div>
      </div>

      <div className="mt-md pt-md border-t border-outline-variant/30 flex justify-end items-center gap-4">
        <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
          <AppIcon name="bolt" size="h-4 w-4" className="text-secondary" />
          {t('upload.poweredBy')}
        </p>
        <button
          type="button"
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className={cn(buttonPrimaryClass, 'px-lg py-3 rounded-2xl shadow-[0_4px_12px_rgba(0,88,190,0.2)] gap-2')}
        >
          <AppIcon name="document_scanner" size="h-5 w-5" />
          {t('upload.analyze')}
        </button>
      </div>
    </section>
  );
}
