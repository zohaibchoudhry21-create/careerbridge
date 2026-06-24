import ResumeModal from './ResumeModal';

export default function StartChoiceModal({ open, onClose, onImport, onBlank }) {
  const footer = (
    <div className="flex flex-col sm:flex-row gap-sm">
      <button
        type="button"
        onClick={onBlank}
        className="flex-1 rounded-xl border border-outline-variant py-sm font-label-md text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-colors"
      >
        Start from blank
      </button>
      <button
        type="button"
        onClick={onImport}
        className="flex-1 rounded-xl bg-secondary py-sm font-label-md text-white hover:bg-secondary-container transition-colors"
      >
        Import resume
      </button>
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
