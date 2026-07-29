import { describe, it, expect } from 'vitest';

function extractKeywords(title: string): string[] {
  return title
    .toLowerCase()
    .split(/[\s\-]+/)
    .filter((w) => w.length >= 3 && !['european', 'round'].includes(w));
}

function isTitleMatch(videoTitle: string, eventTitle: string): boolean {
  const lowerVideoTitle = videoTitle.toLowerCase();
  const keywords = extractKeywords(eventTitle);
  const matchCount = keywords.filter((kw) => lowerVideoTitle.includes(kw)).length;
  return matchCount >= 2 || (lowerVideoTitle.includes('bmx') && lowerVideoTitle.includes('european'));
}

function buildSearchTerms(eventTitle: string, year: number): string[] {
  return [
    `${eventTitle} ${year}`,
    `UEC BMX European Cup ${year}`,
    'BMX European Cup Round',
  ];
}

function getDateRange(dateStr: string): { publishedAfter: string; publishedBefore: string } {
  const eventDate = new Date(dateStr + 'T00:00:00');
  const dayBefore = new Date(eventDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayAfter = new Date(eventDate);
  dayAfter.setDate(dayAfter.getDate() + 1);
  return {
    publishedAfter: dayBefore.toISOString(),
    publishedBefore: dayAfter.toISOString(),
  };
}

describe('UEC Livestream Search Logic', () => {
  describe('extractKeywords', () => {
    it('extracts meaningful keywords from event title', () => {
      const keywords = extractKeywords('UEC BMX European Cup Round 1');
      expect(keywords).toContain('uec');
      expect(keywords).toContain('bmx');
      expect(keywords).not.toContain('european');
      expect(keywords).not.toContain('round');
    });

    it('filters out words shorter than 3 characters', () => {
      const keywords = extractKeywords('BMX Cup 1');
      expect(keywords).toContain('bmx');
      expect(keywords).toContain('cup');
      expect(keywords).not.toContain('1');
    });
  });

  describe('isTitleMatch', () => {
    it('matches when 2 or more keywords are present', () => {
      expect(isTitleMatch('uec bmx european cup 2026', 'UEC BMX European Cup Round 1')).toBe(true);
    });

    it('matches when both bmx and european are present', () => {
      expect(isTitleMatch('bmx european championship 2026', 'UEC BMX European Cup Round 1')).toBe(true);
    });

    it('does not match when fewer than 2 keywords and no bmx+european', () => {
      expect(isTitleMatch('random cycling video 2026', 'UEC BMX European Cup Round 1')).toBe(false);
    });
  });

  describe('buildSearchTerms', () => {
    it('builds search terms with event title and year', () => {
      const terms = buildSearchTerms('UEC BMX European Cup Round 1', 2026);
      expect(terms).toHaveLength(3);
      expect(terms[0]).toBe('UEC BMX European Cup Round 1 2026');
      expect(terms[1]).toBe('UEC BMX European Cup 2026');
      expect(terms[2]).toBe('BMX European Cup Round');
    });
  });

  describe('getDateRange', () => {
    it('returns date range with 1 day before and after', () => {
      const range = getDateRange('2026-04-12');
      expect(range.publishedAfter).toContain('2026-04-11');
      expect(range.publishedBefore).toContain('2026-04-13');
    });
  });
});
