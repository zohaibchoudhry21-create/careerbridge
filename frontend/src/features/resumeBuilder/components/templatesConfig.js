export const TEMPLATE_IDS = ['classic', 'modern', 'minimal', 'professional', 'elegant'];

export const TEMPLATES = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Centered header, traditional serif layout',
    accent: 'bg-primary-container',
    preview: 'border-outline-variant',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Sidebar layout with skills on the left',
    accent: 'bg-primary-container',
    preview: 'border-outline-variant',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean sans-serif with subtle dividers',
    accent: 'bg-on-surface',
    preview: 'border-outline-variant',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Bold blue header bar, corporate style',
    accent: 'bg-secondary',
    preview: 'border-secondary',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Serif with warm accent borders',
    accent: 'bg-amber-700',
    preview: 'border-amber-500',
  },
];

export const DEFAULT_TEMPLATE = 'classic';

export const getTemplateById = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
