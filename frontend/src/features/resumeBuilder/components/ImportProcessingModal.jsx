import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResumeModal from './ResumeModal';

export default function ImportProcessingModal({ open }) {
  const { t } = useTranslation('resumeBuilder');
  const [progress, setProgress] = useState(8);

  useEffect(() => {
    if (!open) {
      setProgress(8);
      return undefined;
    }

    const timer = setInterval(() => {
      setProgress((value) => (value >= 92 ? value : value + Math.random() * 12));
    }, 700);

    return () => clearInterval(timer);
  }, [open]);

  return (
    <ResumeModal open={open} onClose={() => {}} showClose={false} title={t('import.processingTitle')} size="sm">
      <div className="p-lg space-y-md">
        <p className="font-body-md text-on-surface-variant">
          {t('import.processingDescription')}
        </p>
        <div className="h-2 rounded-full bg-surface-container overflow-hidden">
          <div
            className="h-full rounded-full bg-secondary transition-all duration-500"
            style={{ width: `${Math.min(progress, 95)}%` }}
          />
        </div>
      </div>
    </ResumeModal>
  );
}
