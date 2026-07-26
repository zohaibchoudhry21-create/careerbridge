import { useTranslation } from 'react-i18next';
import ResumeModal from './ResumeModal';
import Button from '../../../components/ui/Button';

export default function StartChoiceModal({ open, onClose, onImport, onBlank }) {
  const { t } = useTranslation('resumeBuilder');

  const footer = (
    <div className="flex flex-col sm:flex-row gap-sm">
      <Button type="button" variant="secondary" onClick={onBlank} className="flex-1 py-sm">
        {t('startChoice.startBlank')}
      </Button>
      <Button type="button" variant="primary" onClick={onImport} className="flex-1 py-sm">
        {t('startChoice.importResume')}
      </Button>
    </div>
  );

  return (
    <ResumeModal open={open} onClose={onClose} title={t('startChoice.title')} size="sm" footer={footer}>
      <p className="px-lg pb-lg font-body-md text-on-surface-variant">
        {t('startChoice.description')}
      </p>
    </ResumeModal>
  );
}
