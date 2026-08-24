/**
 * Panel prompt helpers: seat question scaffolds, theme routing, pressure styles.
 */

/** Theme value → primary seat index (0 = domain/technical, 1 = hiring, 2 = people). */
export const THEME_SEAT_INDEX = Object.freeze({
  Coding: 0,
  'System design': 0,
  'Case study': 1,
  Leadership: 1,
  Behavioral: 2,
  Communication: 2,
});

const SEAT_ARCHETYPE_HINTS = Object.freeze({
  technical: [
    'Walk me through a technical decision you owned and the trade-offs you weighed.',
    'How would you explain a complex part of your work to someone non-technical?',
    'Tell me about a time something broke in production and how you handled it.',
  ],
  hiring: [
    'Describe a project where you drove impact end-to-end — what was your role?',
    'How do you prioritize when stakeholders pull in different directions?',
    'Give an example of a tough judgment call you made under pressure.',
  ],
  people: [
    'Why this role, and what are you looking for in your next team?',
    'How do you handle feedback or conflict on a team?',
    'Tell me about a time you had to communicate a difficult message clearly.',
  ],
});

const inferSeatArchetype = (seat = {}, seatIndex = 0) => {
  const title = String(seat.title || '').toLowerCase();
  if (
    /technical|domain|creative|design|clinical|subject|engineering|product peer/i.test(title) ||
    seatIndex === 0
  ) {
    if (/people|culture|hr|partner/i.test(title) && seatIndex === 2) return 'people';
    if (/hiring|manager|studio|leadership/i.test(title) && seatIndex === 1) return 'hiring';
    if (seatIndex === 2 && /people|culture|hr|partner/i.test(title)) return 'people';
    if (seatIndex === 1 && /hiring|manager|studio|leadership/i.test(title)) return 'hiring';
    if (seatIndex === 0) return 'technical';
  }
  if (/hiring|manager|studio|leadership|product/i.test(title) || seatIndex === 1) return 'hiring';
  if (/people|culture|hr|partner/i.test(title) || seatIndex === 2) return 'people';
  return 'technical';
};

const themeHintsForSeat = (seatIndex, focusAreas = []) => {
  const themes = (Array.isArray(focusAreas) ? focusAreas : []).filter(Boolean);
  return themes.filter((theme) => (THEME_SEAT_INDEX[theme] ?? -1) === seatIndex);
};

/**
 * @param {object} seat
 * @param {number} seatIndex
 * @param {string} roleLabel
 * @param {string[]} focusAreas
 * @returns {string[]}
 */
export const buildPanelSeatQuestionHints = (seat, seatIndex, roleLabel, focusAreas = []) => {
  const role = String(roleLabel || 'this role').trim() || 'this role';
  const archetype = inferSeatArchetype(seat, seatIndex);
  const base = [...(SEAT_ARCHETYPE_HINTS[archetype] || SEAT_ARCHETYPE_HINTS.technical)];

  const themed = themeHintsForSeat(seatIndex, focusAreas);
  if (themed.includes('Coding')) {
    base.unshift(`Ask about hands-on coding or implementation relevant to ${role}.`);
  }
  if (themed.includes('System design')) {
    base.unshift(`Probe system design or architecture choices for ${role}.`);
  }
  if (themed.includes('Case study')) {
    base.unshift(`Use a realistic scenario for ${role} and ask how they would approach it.`);
  }
  if (themed.includes('Leadership')) {
    base.unshift(`Ask about ownership, influence, or leading without authority.`);
  }
  if (themed.includes('Behavioral')) {
    base.unshift(`Use a behavioral STAR-style question about teamwork or culture.`);
  }
  if (themed.includes('Communication')) {
    base.unshift(`Ask them to explain something complex clearly or handle a stakeholder moment.`);
  }

  return [...new Set(base)].slice(0, 3);
};

export const buildPanelPressureBlock = (difficulty = 'medium') => {
  const level = String(difficulty || 'medium').toLowerCase();
  if (level === 'easy') {
    return `Panel pressure: Supportive
- Encourage the candidate; allow thinking pauses before follow-ups.
- Use warm bridges ("Take your time", "No rush").
- At most one gentle follow-up per topic; avoid interrupting or rapid-fire probes.
- Acknowledge effort even when answers are incomplete.`;
  }
  if (level === 'hard') {
    return `Panel pressure: Demanding
- Keep acknowledgments short ("Noted.", "Understood.").
- When answers are vague, probe directly: "Can you be more specific?" / "What was your personal contribution?"
- Push for metrics, trade-offs, and ownership; less reassurance between probes.
- Maintain professional tone — never rude or sarcastic.`;
  }
  return `Panel pressure: Balanced
- Real hiring-panel pace: courteous, efficient, fair follow-ups.
- One focused clarifying follow-up when needed, then rotate or move on.
- Acknowledge specifically, then hand off or continue naturally.`;
};

export const buildPanelThemeBlock = (focusAreas = [], seats = []) => {
  const themes = (Array.isArray(focusAreas) ? focusAreas : []).filter(Boolean);
  if (!themes.length) {
    return 'Panel themes: Cover a natural mix across all three perspectives for this role.';
  }

  const assignments = themes.map((theme) => {
    const idx = THEME_SEAT_INDEX[theme] ?? 0;
    const seat = seats[idx];
    const name = seat?.displayName || `Seat ${idx + 1}`;
    return `"${theme}" → prioritize ${name} (${seat?.title || 'panelist'})`;
  });

  return `Panel themes (must cover — at least one question per selected theme):
${assignments.map((line) => `- ${line}`).join('\n')}
- Do not ignore selected themes; distribute them across the panel naturally.`;
};

export const formatSeatPromptBlock = (seat, seatIndex, roleLabel, focusAreas) => {
  const hints = buildPanelSeatQuestionHints(seat, seatIndex, roleLabel, focusAreas);
  const preferredThemes = themeHintsForSeat(seatIndex, focusAreas);
  const themeLine = preferredThemes.length
    ? `    Preferred themes: ${preferredThemes.join(', ')}`
    : '';

  return `  ${seatIndex + 1}) [SEAT:${seatIndex}] ${seat.displayName} — ${seat.title} — ${seat.focus}
    Tag (MUST prefix every turn from this seat): [SEAT:${seatIndex}]
    Cue (spoken immediately after the tag): "${seat.cue}" OR "${seat.displayName} here…"
    Sample angles (rephrase naturally — not scripts):
${hints.map((h) => `      - ${h}`).join('\n')}${themeLine ? `\n${themeLine}` : ''}`;
};

/**
 * Instructions for the machine-parseable seat prefix the UI uses for speaker highlighting.
 * @param {Array} seats
 */
export const buildPanelSeatTagBlock = (seats = []) => {
  const list = (Array.isArray(seats) ? seats : []).slice(0, 3);
  const examples = list
    .map((seat, index) => {
      const cue = seat?.cue || `${seat?.displayName || 'Panelist'} here…`;
      return `  "[SEAT:${index}] ${cue}"`;
    })
    .join('\n');

  return `Machine-readable speaker tag (critical — the UI reads this to highlight the active panelist):
- EVERY panelist turn you generate MUST begin with [SEAT:N] where N is the 0-based seat index: 0 = first panelist, 1 = second, 2 = third (matching the numbered list below).
- Put the tag at the very start of the turn — no words before it — then the cue or spoken line.
- Format exactly: [SEAT:0], [SEAT:1], or [SEAT:2] (digits only, no spaces inside brackets).
- Examples:
${examples}
- The opening greeting is pre-spoken (firstMessage) — do NOT repeat it. From your first generated turn onward, always include [SEAT:N].
- After the tag, still use that seat's cue phrase or "Name here…" for natural speech.`;
};
