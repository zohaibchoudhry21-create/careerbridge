/**
 * Display helpers for named panel seats.
 */

export const seatDisplayName = (seat) => String(seat?.displayName || '').trim();

export const seatTitle = (seat) => String(seat?.title || '').trim();

/** "Alex · Hiring Manager" */
export const formatSeatLabel = (seat) => {
  const name = seatDisplayName(seat);
  const title = seatTitle(seat);
  if (name && title) return `${name} · ${title}`;
  return name || title || 'Panelist';
};

/** Short badge tag preferring first name */
export const shortSeatNameTag = (seat) => {
  const name = seatDisplayName(seat);
  if (name) {
    const first = name.split(/\s+/)[0];
    return first.slice(0, 12);
  }
  const title = seatTitle(seat);
  if (!title) return 'Panel';
  const first = title.split(/[|/·—-]/)[0].trim();
  const words = first.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 12);
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
};

export const seatInitial = (seat) => {
  const name = seatDisplayName(seat);
  if (name) return name.charAt(0).toUpperCase();
  const title = seatTitle(seat);
  return title ? title.charAt(0).toUpperCase() : '?';
};
