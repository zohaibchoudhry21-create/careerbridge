/**
 * Pass 2 — Candidate Fact Extraction
 * Content-aware immutable fact ledger (not tied to fixed field names).
 */

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const YEAR_RE = /\b(?:19|20)\d{2}\b/g;
const PHONE_RE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}/g;

const normalize = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const unique = (values = []) => {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const trimmed = String(value || '').trim();
    if (!trimmed) continue;
    const key = normalize(trimmed);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
};

const collectFromNodes = (nodes = []) => {
  const entities = [];
  const dates = [];
  const ownedTerms = [];
  const metrics = [];

  for (const node of nodes) {
    const payload = node.payload || {};
    const blob = [
      payload.text,
      ...(payload.items || []),
      ...(payload.paragraphs || []),
      ...(payload.entries || []).flatMap((e) => [
        e.title,
        e.company,
        e.institution,
        e.degree,
        e.name,
        e.duration,
        e.description,
        ...(e.bullets || []),
        ...(e.technologies || []),
      ]),
    ]
      .filter(Boolean)
      .join('\n');

    for (const entry of payload.entries || []) {
      if (entry.company) entities.push(entry.company);
      if (entry.institution) entities.push(entry.institution);
      if (entry.name) entities.push(entry.name);
      if (entry.title) entities.push(entry.title);
      if (entry.degree) entities.push(entry.degree);
      if (entry.duration) dates.push(entry.duration);
    }

    if (Array.isArray(payload.items)) {
      ownedTerms.push(...payload.items);
    }

    const years = blob.match(YEAR_RE) || [];
    dates.push(...years);

    const metricHits = blob.match(/\b\d+(?:\.\d+)?%|\$\d[\d,]*(?:\.\d+)?|\b\d{1,3}(?:,\d{3})+\b/g) || [];
    metrics.push(...metricHits);
  }

  return { entities, dates, ownedTerms, metrics };
};

/**
 * @param {object} understanding - output of understandPass
 */
export const runFactsPass = (understanding = {}) => {
  const structured = understanding.structured || {};
  const fromNodes = collectFromNodes(understanding.nodes || []);

  const typedEntities = [
    ...(structured.workExperience || []).flatMap((j) => [j.company, j.title]),
    ...(structured.education || []).flatMap((e) => [e.institution, e.degree]),
    ...(structured.projects || []).map((p) => p.name),
    ...(structured.certifications || []),
  ];

  const typedDates = [
    ...(structured.workExperience || []).map((j) => j.duration),
    ...(structured.education || []).map((e) => e.duration),
    ...(structured.projects || []).map((p) => p.duration),
  ];

  const fullText = String(understanding.resumeText || '');
  const emails = unique(fullText.match(EMAIL_RE) || []);
  const phones = unique(fullText.match(PHONE_RE) || []);

  const facts = {
    identity: {
      name: understanding.identity?.name || structured.name || '',
      email: understanding.identity?.contact?.email || structured.contact?.email || emails[0] || '',
      phone: understanding.identity?.contact?.phone || structured.contact?.phone || phones[0] || '',
      address: understanding.identity?.contact?.address || structured.contact?.address || '',
    },
    entities: unique([...typedEntities, ...fromNodes.entities]),
    dates: unique([...typedDates, ...fromNodes.dates]),
    ownedTerms: unique([
      ...(structured.skills || []),
      ...(structured.languages || []),
      ...fromNodes.ownedTerms,
    ]),
    metrics: unique(fromNodes.metrics),
    sectionHeadings: unique((understanding.nodes || []).map((n) => n.heading)),
    nodeCount: understanding.nodeCount || 0,
  };

  // Immutable ledger for rewrite prompts / validation
  facts.immutableTokens = unique([
    facts.identity.name,
    facts.identity.email,
    facts.identity.phone,
    ...facts.entities,
    ...facts.dates.flatMap((d) => d.match(YEAR_RE) || []),
    ...facts.metrics,
  ]);

  return facts;
};
