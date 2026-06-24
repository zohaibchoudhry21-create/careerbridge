import ResumeModal from './ResumeModal';
import { RESUME_SECTION_TYPES } from '../data/resumeSectionTypes';

export default function AddContentModal({ open, onClose, existingTypes, onAddSection }) {
  return (
    <ResumeModal open={open} onClose={onClose} title="Add Content" size="xl">
      <div className="p-lg grid sm:grid-cols-2 lg:grid-cols-3 gap-md">
        {RESUME_SECTION_TYPES.map((section) => {
          const disabled = existingTypes.includes(section.type);

          return (
            <button
              key={section.type}
              type="button"
              disabled={disabled}
              onClick={() => onAddSection(section.type)}
              className="text-left rounded-2xl border border-outline-variant/60 p-md hover:border-secondary/40 hover:bg-surface-container-low transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-secondary text-[28px] mb-sm">{section.icon}</span>
              <h4 className="font-label-lg text-on-surface mb-1">{section.label}</h4>
              <p className="font-body-sm text-on-surface-variant">{section.description}</p>
            </button>
          );
        })}
      </div>
    </ResumeModal>
  );
}
