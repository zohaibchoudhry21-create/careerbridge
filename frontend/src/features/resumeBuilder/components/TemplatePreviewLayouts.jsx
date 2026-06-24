/**
 * Full A4 (794×1123) resume layout previews — scaled to fit cards via TemplatePreviewWrapper.
 */

import TemplatePreviewWrapper from './TemplatePreviewWrapper';
import { mergeCustomize } from '../data/resumeCustomizeDefaults';
import ClassicClear, { CLASSIC_CLEAR_SAMPLE_DATA } from '../templates/ClassicClear';
import AtlanticBlue, { ATLANTIC_BLUE_SAMPLE_DATA } from '../templates/AtlanticBlue';
import MercuryFlow, { MERCURY_FLOW_SAMPLE_DATA } from '../templates/MercuryFlow';
import SteadyForm, { STEADY_FORM_SAMPLE_DATA } from '../templates/SteadyForm';

/** CLASSIC CLEAR — full template preview */
export function ClassicClearPreview({ customize }) {
  return <ClassicClear resumeData={CLASSIC_CLEAR_SAMPLE_DATA} customize={customize} />;
}

/** ATLANTIC BLUE — full two-column template preview */
export function AtlanticSidebarPreview({ customize }) {
  return <AtlanticBlue resumeData={ATLANTIC_BLUE_SAMPLE_DATA} customize={customize} />;
}

/** MERCURY FLOW — light header, gray section bars */
export function MercuryFlowPreview({ customize }) {
  return <MercuryFlow resumeData={MERCURY_FLOW_SAMPLE_DATA} customize={customize} />;
}

/** STEADY FORM — name left, photo right, gray section bars */
export function SteadyFormPreview({ customize }) {
  return <SteadyForm resumeData={STEADY_FORM_SAMPLE_DATA} customize={customize} />;
}

const PREVIEW_COMPONENTS = {
  'classic-clear': ClassicClearPreview,
  'atlantic-sidebar': AtlanticSidebarPreview,
  'mercury-flow': MercuryFlowPreview,
  'steady-form': SteadyFormPreview,
};

export function resolvePreviewLayout(template) {
  if (template.previewLayout) return template.previewLayout;

  const family = template.family?.toLowerCase();
  if (family === 'classic') return 'classic-clear';
  if (family === 'atlantic') return 'atlantic-sidebar';
  if (family === 'mercury') return 'mercury-flow';
  if (family === 'steady') return 'steady-form';

  return 'classic-clear';
}

export function TemplateLayoutPreview({ template }) {
  const layoutKey = resolvePreviewLayout(template);
  const customize = mergeCustomize({}, template?.id);
  const Component = PREVIEW_COMPONENTS[layoutKey] || ClassicClearPreview;

  return <Component customize={customize} />;
}

/** Global scaled preview — used by every template card and modal */
export function ScaledTemplatePreview({ template, className = '' }) {
  return (
    <TemplatePreviewWrapper className={`rounded-lg border border-outline-variant/40 ${className}`}>
      <TemplateLayoutPreview template={template} />
    </TemplatePreviewWrapper>
  );
}

export function TemplateLargeScaledPreview({ template }) {
  return (
    <TemplatePreviewWrapper className="rounded-xl border border-outline-variant/40 max-w-md mx-auto">
      <TemplateLayoutPreview template={template} />
    </TemplatePreviewWrapper>
  );
}
