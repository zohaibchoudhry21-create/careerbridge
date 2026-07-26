import { useState } from 'react';
import ResumeModal from './ResumeModal';
import Button from '../../../components/ui/Button';

export default function DeleteSectionModal({ open, sectionName, onClose, onConfirm }) {
  const [confirmed, setConfirmed] = useState(false);

  const handleClose = () => {
    setConfirmed(false);
    onClose();
  };

  const footer = (
    <div className="flex gap-sm justify-end">
      <Button type="button" variant="secondary" onClick={handleClose} className="px-md py-sm">
        Cancel
      </Button>
      <Button
        type="button"
        variant="destructive"
        disabled={!confirmed}
        onClick={() => {
          onConfirm();
          setConfirmed(false);
        }}
        className="px-md py-sm disabled:opacity-50"
      >
        Delete Section
      </Button>
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
