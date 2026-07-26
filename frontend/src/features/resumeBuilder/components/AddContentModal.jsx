import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import ResumeModal from './ResumeModal';
import { RESUME_SECTION_TYPES } from '../data/resumeSectionTypes';

export default function AddContentModal({ open, onClose, existingTypes, onAddSection }) {
  const { t } = useTranslation('resumeBuilder');

  return (
    <ResumeModal open={open} onClose={onClose} title={t('addContent.title')} size="xl">
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
              <AppIcon name={section.icon} size="h-7 w-7" className="text-secondary mb-sm" />
              <h4 className="font-label-lg text-on-surface mb-1">
                {t(`sectionTypes.${section.type}.label`, { defaultValue: section.label })}
              </h4>
              <p className="font-body-sm text-on-surface-variant">
                {t(`sectionTypes.${section.type}.description`, { defaultValue: section.description })}
              </p>
            </button>
          );
        })}
      </div>
    </ResumeModal>
  );
}
