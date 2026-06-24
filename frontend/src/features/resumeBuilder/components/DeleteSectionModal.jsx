import { useState } from 'react';
import ResumeModal from './ResumeModal';

export default function DeleteSectionModal({ open, sectionName, onClose, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false);

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  const footer = (
    <div className="flex gap-sm justify-end">
      <button
        type="button"
        onClick={handleClose}
        className="rounded-xl border border-outline-variant px-md py-sm font-label-md text-on-surface-variant hover:border-secondary/40 transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        disabled={!confirmed}
        onClick={() => {
          onConfirm();
          setConfirmed(false);
        }}
        className="rounded-xl bg-error px-md py-sm font-label-md text-white disabled:opacity-50 transition-colors"
      >
        Delete Section
      </button>
    </div>
  );

  return (
    <ResumeModal
      open={open}
      onClose={handleClose}
      title={`Delete "${sectionName}" section?`}
      size="sm"
      footer={footer}
    >
      <div className="p-lg space-y-md">
        <p className="font-body-md text-on-surface-variant">
          This will permanently delete this section and all its entries. This action can&apos;t be undone.
        </p>
        <label className="flex items-start gap-2 font-body-md text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(event) => setConfirmed(event.target.checked)}
            className="mt-1"
          />
          I understand, continue.
        </label>
      </div>
    </ResumeModal>
  );
}
