/**
 * Match assistant text to a panel seat via [SEAT:N] tag, with cue/name/title fallback.
 */

import { seatDisplayName, seatTitle, shortSeatNameTag } from './panelSeatDisplay.js';

const MATCH_WINDOW_CHARS = 120;
const PANEL_SEAT_TAG_RE = /^\s*\[SEAT:(\d+)\]\s*/i;

/**
 * Parse a leading [SEAT:N] tag from assistant text.
 * @returns {{ seatIndex: number, textWithoutTag: string } | null}
 */
export const parsePanelSeatTag = (assistantText = '') => {
  const text = String(assistantText || '');
  const match = text.match(PANEL_SEAT_TAG_RE);
  if (!match) return null;

  const seatIndex = Number.parseInt(match[1], 10);
  if (!Number.isInteger(seatIndex) || seatIndex < 0) return null;

  return {
    seatIndex,
    textWithoutTag: text.slice(match[0].length),
  };
};

/** Remove a leading [SEAT:N] tag for transcript display. */
export const stripPanelSeatTag = (assistantText = '') => {
  const tagged = parsePanelSeatTag(assistantText);
  return tagged ? tagged.textWithoutTag : String(assistantText || '');
};

/** Use only the opening of a turn — hand-offs appear at the start. */
export const extractPanelMatchText = (assistantText = '') => {
  const text = stripPanelSeatTag(assistantText).trim();
  if (!text) return '';
  const firstSentence = text.split(/[.!?…]\s/)[0] || text;
  return firstSentence.slice(0, MATCH_WINDOW_CHARS).toLowerCase();
};

const matchPanelSeatByText = (seats = [], assistantText = '') => {
  const text = extractPanelMatchText(assistantText);
  if (!text) return -1;

  for (let i = 0; i < seats.length; i += 1) {
    const cue = String(seats[i]?.cue || '')
      .toLowerCase()
      .replace(/[.…]+$/g, '')
      .trim();
    if (cue && text.includes(cue)) return i;
  }

  for (let i = 0; i < seats.length; i += 1) {
    const name = seatDisplayName(seats[i]).toLowerCase();
    if (name.length >= 2 && text.includes(name)) return i;
  }

  for (let i = 0; i < seats.length; i += 1) {
    const title = seatTitle(seats[i]).toLowerCase();
    if (title.length >= 4 && text.includes(title)) return i;
  }

  return -1;
};

export const matchActivePanelSeatIndex = (seats = [], assistantText = '') => {
  const list = Array.isArray(seats) ? seats : [];
  if (!list.length) return 0;

  const tagged = parsePanelSeatTag(assistantText);
  if (tagged && tagged.seatIndex >= 0 && tagged.seatIndex < list.length) {
    return tagged.seatIndex;
  }

  const fuzzyMatch = matchPanelSeatByText(list, assistantText);
  if (fuzzyMatch >= 0) return fuzzyMatch;

  return -1;
};

/**
 * Sticky variant — keeps last matched seat when the current turn has no detectable hand-off.
 */
export const matchActivePanelSeatIndexSticky = (seats = [], assistantText = '', lastIndex = 0) => {
  const list = Array.isArray(seats) ? seats : [];
  if (!list.length) return 0;

  const matched = matchActivePanelSeatIndex(list, assistantText);
  if (matched >= 0) return matched;

  const safeLast = Number.isInteger(lastIndex) ? lastIndex : 0;
  if (safeLast >= 0 && safeLast < list.length) return safeLast;
  return 0;
};

/** Rotate to the next seat for "up next" hints while the candidate is speaking. */
export const predictNextPanelSeatIndex = (seats = [], lastIndex = 0) => {
  const list = Array.isArray(seats) ? seats : [];
  if (!list.length) return 0;
  const safeLast = Number.isInteger(lastIndex) && lastIndex >= 0 ? lastIndex : 0;
  return (safeLast + 1) % list.length;
};

/** @deprecated Prefer shortSeatNameTag(seat) — kept for title-only callers. */
export const shortSeatTag = (seatTitleOrSeat = '') => {
  if (seatTitleOrSeat && typeof seatTitleOrSeat === 'object') {
    return shortSeatNameTag(seatTitleOrSeat);
  }
  const raw = String(seatTitleOrSeat || '').trim();
  if (!raw) return 'Panel';
  const first = raw.split(/[|/·—-]/)[0].trim();
  const words = first.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 12);
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
};

export { shortSeatNameTag };
