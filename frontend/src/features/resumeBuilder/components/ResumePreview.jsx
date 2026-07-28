import { TEMPLATE_COMPONENTS } from './templates';
import { DEFAULT_TEMPLATE } from './templatesConfig';

export default function ResumePreview({ data = {}, templateId = DEFAULT_TEMPLATE }) {
  const Template = TEMPLATE_COMPONENTS[templateId] || TEMPLATE_COMPONENTS[DEFAULT_TEMPLATE];
  return <Template data={data} />;
}
