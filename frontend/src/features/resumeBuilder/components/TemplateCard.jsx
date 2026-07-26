import { useTranslation } from 'react-i18next';
import { getTemplateById } from '../data/resumeTemplates';
import { ScaledTemplatePreview, TemplateLargeScaledPreview } from './TemplatePreviewLayouts';

export default function TemplateCard({ template, onClick }) {
  const { t } = useTranslation('resumeBuilder');

  return (
    <button
      type="button"
      onClick={() => onClick(template)}
      className="group text-left rounded-2xl border border-outline-variant/50 bg-white p-3 hover:border-secondary/40 hover:shadow-md transition-all"
    >
      <ScaledTemplatePreview template={template} />
      <p className="mt-3 font-label-md text-label-md text-on-surface group-hover:text-secondary transition-colors">
        {t(`templates.${template.id}.name`, { defaultValue: template.name })}
      </p>
    </button>
  );
}

export function TemplateLargePreview({ templateId }) {
  const template = getTemplateById(templateId);
  return <TemplateLargeScaledPreview template={template} />;
}
