import { useTranslation } from 'react-i18next';
import AppIcon from '../../../components/icons/AppIcon';
import ResumeModal from './ResumeModal';
import { TemplateLargePreview } from './TemplateCard';

const FEATURE_KEYS = [
  'templatePreview.features.pageSize',
  'templatePreview.features.editableText',
  'templatePreview.features.customizable',
  'templatePreview.features.printReady',
  'templatePreview.features.shareableLink',
];

export default function TemplatePreviewModal({ open, template, onClose, onUseTemplate }) {
  const { t } = useTranslation('resumeBuilder');

  if (!template) return null;

  return (
    <ResumeModal open={open} onClose={onClose} size="xl">
      <div className="grid md:grid-cols-2 gap-lg p-lg">
        <div className="min-h-[360px]">
          <TemplateLargePreview templateId={template.id} />
        </div>
        <div className="flex flex-col">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">
            {t(`templates.${template.id}.name`, { defaultValue: template.name })}
          </h3>
          <p className="font-body-md text-on-surface-variant mb-md">
            {t(`templates.${template.id}.description`, { defaultValue: template.description })}
          </p>
          <ul className="space-y-2">
            {FEATURE_KEYS.map((featureKey) => (
              <li key={featureKey} className="flex items-center gap-2 font-body-md text-on-surface">
                <AppIcon name="check_circle" size="button" className="text-secondary" />
                {t(featureKey)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onUseTemplate(template)}
            className="mt-lg w-full rounded-xl bg-secondary py-sm font-label-md text-white hover:bg-secondary-container transition-colors"
          >
            {t('templatePreview.useTemplate')}
          </button>
        </div>
      </div>
    </ResumeModal>
  );
}
