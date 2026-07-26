import ResumeModal from './ResumeModal';
import Button from '../../../components/ui/Button';

export default function StartChoiceModal({ open, onClose, onImport, onBlank }) {
  const footer = (
    <div className="flex flex-col sm:flex-row gap-sm">
      <Button type="button" variant="secondary" onClick={onBlank} className="flex-1 py-sm">
        Start from blank
      </Button>
      <Button type="button" variant="primary" onClick={onImport} className="flex-1 py-sm">
        Import resume
      </Button>
    </div>
  );

  return (
    <ResumeModal open={open} onClose={onClose} title="Import your existing resume" size="sm" footer={footer}>
      <p className="px-lg pb-lg font-body-md text-on-surface-variant">
        Bring in an existing resume or start with a blank canvas using your selected template.
      </p>
    </ResumeModal>
  );
}
