import { useTranslation } from 'react-i18next';
import { RESUME_TEMPLATES } from '../../../data/resumeTemplates';
import { ScaledTemplatePreview } from '../../TemplatePreviewLayouts';
import CustomizeSectionCard from '../CustomizeSectionCard';
import { useCustomizeDispatch } from '../useCustomizeDispatch';

export default function TemplatesSection() {
  const { t } = useTranslation('resumeBuilder');
  const { templateId, dispatch } = useCustomizeDispatch();

  return (
    <CustomizeSectionCard
      title={t('customize.templates.title')}
      description={t('customize.templates.description')}
    >
      <div className="grid grid-cols-2 gap-md">
        {RESUME_TEMPLATES.map((template) => {
          const isSelected = templateId === template.id;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => dispatch({ type: 'SET_TEMPLATE_ID', payload: template.id })}
              className={`text-left rounded-xl border p-2 transition-all ${
                isSelected
                  ? 'border-secondary ring-2 ring-secondary/30 bg-secondary/5'
                  : 'border-outline-variant hover:border-secondary/40 bg-surface-container-lowest'
              }`}
            >
              <ScaledTemplatePreview template={template} />
              <p
                className={`mt-2 font-label-sm px-1 ${
                  isSelected ? 'text-secondary' : 'text-on-surface'
                }`}
              >
                {t(`templates.${template.id}.name`, { defaultValue: template.name })}
              </p>
            </button>
          );
        })}
      </div>
    </CustomizeSectionCard>
  );
}
