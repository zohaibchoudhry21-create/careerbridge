import ResumeModal from './ResumeModal';
import { TemplateLargePreview } from './TemplateCard';

const FEATURES = [
  'A4 / US-Letter Size',
  'Editable Text',
  'Fully customizable',
  'Print ready format',
  'Online resume with shareable link',
];

export default function TemplatePreviewModal({ open, template, onClose, onUseTemplate }) {
  if (!template) return null;

  return (
    <ResumeModal open={open} onClose={onClose} size="xl">
      <div className="grid md:grid-cols-2 gap-lg p-lg">
        <div className="min-h-[360px]">
          <TemplateLargePreview templateId={template.id} />
        </div>
        <div className="flex flex-col">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-sm">{template.name}</h3>
          <p className="font-body-md text-on-surface-variant mb-md">{template.description}</p>
          <ul className="space-y-2">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-2 font-body-md text-on-surface">
                <span className="material-symbols-outlined text-secondary text-[18px]">check_circle</span>
                {feature}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => onUseTemplate(template)}
            className="mt-lg w-full rounded-xl bg-secondary py-sm font-label-md text-white hover:bg-secondary-container transition-colors"
          >
            Use this template
          </button>
        </div>
      </div>
    </ResumeModal>
  );
}
