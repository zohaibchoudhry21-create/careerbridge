import { describe, expect, it } from 'vitest';
import {
  extractPanelMatchText,
  matchActivePanelSeatIndex,
  matchActivePanelSeatIndexSticky,
  parsePanelSeatTag,
  predictNextPanelSeatIndex,
  stripPanelSeatTag,
} from './panelSeatMatch.js';

const SEATS = [
  {
    displayName: 'Alex',
    title: 'Technical lead',
    cue: 'From the tech side…',
  },
  {
    displayName: 'Jordan',
    title: 'Hiring manager',
    cue: 'Hiring manager here…',
  },
  {
    displayName: 'Sam',
    title: 'People partner',
    cue: 'Quick one from HR…',
  },
];

describe('parsePanelSeatTag', () => {
  it('parses a leading [SEAT:N] tag', () => {
    expect(parsePanelSeatTag('[SEAT:1] Jordan here — tell me about ownership.')).toEqual({
      seatIndex: 1,
      textWithoutTag: 'Jordan here — tell me about ownership.',
    });
  });

  it('returns null when no tag is present', () => {
    expect(parsePanelSeatTag('From the tech side… walk me through your last project.')).toBeNull();
  });
});

describe('stripPanelSeatTag', () => {
  it('removes the tag prefix for display', () => {
    expect(stripPanelSeatTag('[SEAT:0] From the tech side…')).toBe('From the tech side…');
  });
});

describe('extractPanelMatchText', () => {
  it('uses only the opening portion of a long turn', () => {
    const long = `${'From the tech side… '.repeat(20)}Tell me about your project.`;
    expect(extractPanelMatchText(long).length).toBeLessThanOrEqual(120);
    expect(extractPanelMatchText(long)).toContain('from the tech side');
  });

  it('strips the seat tag before fuzzy matching', () => {
    expect(extractPanelMatchText('[SEAT:2] Quick one from HR… why this role?')).toContain(
      'quick one from hr'
    );
  });
});

describe('matchActivePanelSeatIndex', () => {
  it('matches [SEAT:N] tag deterministically', () => {
    expect(
      matchActivePanelSeatIndex(SEATS, '[SEAT:1] Hiring manager here… tell me about ownership.')
    ).toBe(1);
  });

  it('falls back to cue matching when tag is missing', () => {
    expect(matchActivePanelSeatIndex(SEATS, 'From the tech side… walk me through your last project.')).toBe(
      0
    );
  });

  it('falls back to panelist name when cue is missing', () => {
    expect(matchActivePanelSeatIndex(SEATS, 'Jordan here — tell me about ownership.')).toBe(1);
  });

  it('returns -1 when no tag or text match', () => {
    expect(matchActivePanelSeatIndex(SEATS, 'Thanks for joining today.')).toBe(-1);
  });
});

describe('matchActivePanelSeatIndexSticky', () => {
  it('falls back to last index when no match', () => {
    expect(matchActivePanelSeatIndexSticky(SEATS, 'Thanks for that.', 1)).toBe(1);
  });

  it('updates when a structured tag is detected', () => {
    expect(matchActivePanelSeatIndexSticky(SEATS, '[SEAT:2] Quick one from HR… why this role?', 0)).toBe(
      2
    );
  });
});

describe('predictNextPanelSeatIndex', () => {
  it('rotates to the next seat', () => {
    expect(predictNextPanelSeatIndex(SEATS, 0)).toBe(1);
    expect(predictNextPanelSeatIndex(SEATS, 2)).toBe(0);
  });
});
