const FAMILY_STYLES = {
  classic: {
    previewLayout: 'classic-clear',
    layout: 'single',
    colors: {
      primary: '#1f2937',
      accent: '#6b7280',
      background: '#ffffff',
      sidebar: '#f9fafb',
      header: '#1f2937',
      bodyLine: '#d1d5db',
    },
  },
  atlantic: {
    previewLayout: 'atlantic-sidebar',
    layout: 'sidebar',
    colors: {
      primary: '#0058be',
      accent: '#6b9bd1',
      background: '#ffffff',
      sidebar: '#dce9ff',
      bodyLine: '#b8cfe8',
    },
  },
  mercury: {
    previewLayout: 'mercury-flow',
    layout: 'header-band',
    colors: {
      primary: '#006B5E',
      accent: '#3d9e8f',
      background: '#e8f5f3',
      sidebar: '#e8f5f3',
      header: '#006B5E',
      bodyLine: '#8ec5bc',
    },
  },
  steady: {
    previewLayout: 'steady-form',
    layout: 'single',
    colors: {
      primary: '#1a2b4a',
      accent: '#6b7280',
      background: '#ffffff',
      sidebar: '#f9fafb',
      header: '#1a2b4a',
      bodyLine: '#d1d5db',
    },
  },
};

export const RESUME_TEMPLATES = [
  {
    id: 'classic-clear',
    name: 'CLASSIC CLEAR',
    category: 'simple',
    family: 'classic',
    description:
      'Each template has been crafted with care to make designing your resume an absolute breeze for you.',
    layout: FAMILY_STYLES.classic.layout,
    previewLayout: FAMILY_STYLES.classic.previewLayout,
    colors: FAMILY_STYLES.classic.colors,
  },
  {
    id: 'atlantic-clear',
    name: 'ATLANTIC CLEAR',
    category: 'modern',
    family: 'atlantic',
    description:
      'Each template has been crafted with care to make designing your resume an absolute breeze for you.',
    layout: FAMILY_STYLES.atlantic.layout,
    previewLayout: FAMILY_STYLES.atlantic.previewLayout,
    colors: FAMILY_STYLES.atlantic.colors,
  },
  {
    id: 'mercury-clear',
    name: 'MERCURY CLEAR',
    category: 'modern',
    family: 'mercury',
    description:
      'Each template has been crafted with care to make designing your resume an absolute breeze for you.',
    layout: FAMILY_STYLES.mercury.layout,
    previewLayout: FAMILY_STYLES.mercury.previewLayout,
    colors: FAMILY_STYLES.mercury.colors,
  },
  {
    id: 'steady-form',
    name: 'STEADY FORM',
    category: 'simple',
    family: 'steady',
    description:
      'Each template has been crafted with care to make designing your resume an absolute breeze for you.',
    layout: FAMILY_STYLES.steady.layout,
    previewLayout: FAMILY_STYLES.steady.previewLayout,
    colors: FAMILY_STYLES.steady.colors,
  },
];

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All Templates' },
  { id: 'simple', label: 'Simple' },
  { id: 'modern', label: 'Modern' },
  { id: 'creative', label: 'Creative' },
];

export const getTemplateById = (templateId) =>
  RESUME_TEMPLATES.find((template) => template.id === templateId) || RESUME_TEMPLATES[0];

export const filterTemplates = (category) => {
  if (!category || category === 'all') return RESUME_TEMPLATES;
  return RESUME_TEMPLATES.filter((template) => template.category === category);
};
