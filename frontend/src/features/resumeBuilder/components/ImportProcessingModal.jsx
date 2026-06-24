import { useEffect, useState } from 'react';
import ResumeModal from './ResumeModal';

export default function ImportProcessingModal({ open }) {
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
    <ResumeModal open={open} onClose={() => {}} showClose={false} title="Importing your resume" size="sm">
      <div className="p-lg space-y-md">
        <p className="font-body-md text-on-surface-variant">
          Processing your resume... This may take up to 60 seconds.
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
