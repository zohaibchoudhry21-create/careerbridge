import DOMPurify from 'dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  'ul',
  'ol',
  'li',
  'span',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'div',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class'];

/**
 * Sanitize rich-text HTML before rendering with dangerouslySetInnerHTML.
 */
export function sanitizeHtml(dirty = '') {
  if (!dirty || typeof dirty !== 'string') return '';

  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}

export default sanitizeHtml;
