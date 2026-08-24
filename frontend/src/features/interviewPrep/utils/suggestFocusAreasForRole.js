/**
 * Light role-keyword defaults for focus chips (user can still toggle freely).
 */

const RULES = [
  { test: /front.?end|react|angular|vue|ui|ux|css/i, areas: ['Coding', 'System design'] },
  { test: /back.?end|node|java|python|api|server|devops|sre/i, areas: ['Coding', 'System design'] },
  { test: /full.?stack|software engineer|developer|engineer/i, areas: ['Coding', 'System design'] },
  { test: /product manager|pm\b|product owner/i, areas: ['Case study', 'Communication', 'Leadership'] },
  { test: /data|ml|machine learning|ai engineer|analyst/i, areas: ['Coding', 'Case study'] },
  { test: /manager|lead|director|head of/i, areas: ['Leadership', 'Behavioral', 'Communication'] },
  { test: /design|designer/i, areas: ['Case study', 'Communication'] },
  { test: /hr|recruiter|people/i, areas: ['Behavioral', 'Communication'] },
];

export const suggestFocusAreasForRole = (role) => {
  const text = String(role || '').trim();
  if (!text) return [];

  for (const rule of RULES) {
    if (rule.test.test(text)) return [...rule.areas];
  }

  return ['Behavioral', 'Communication'];
};
