import { describe, it, expect } from 'vitest';

describe('UEC Livestream Search Logic', () => {
  it('should extract keywords from event title', () => {
    const eventTitle = 'UEC BMX European Cup Round 1';
    const keywords = eventTitle
      .toLowerCase()
      .split(/[\s\-]+/)
      .filter((w: string) => w.length >= 3 && !['european', 'round'].includes(w));

    expect(keywords).toContain('uec');
    expect(keywords).toContain('bmx');
    expect(keywords).toContain('cup');
    expect(keywords).not.toContain('european');
    expect(keywords).not.toContain('round');
  });

  it('should match video titles with event keywords', () => {
    const eventTitle = 'UEC BMX European Cup Round 3';
    const videoTitle = '2025 UEC BMX European Cup - Round 3 | Zolder (BEL)';

    const keywords = eventTitle
      .toLowerCase()
      .split(/[\s\-]+/)
      .filter((w: string) => w.length >= 3 && !['european', 'round'].includes(w));

    const matchCount = keywords.filter((kw: string) =>
      videoTitle.toLowerCase().includes(kw)
    ).length;

    expect(matchCount).toBeGreaterThanOrEqual(2);
  });

  it('should match BMX and European keywords as fallback', () => {
    const videoTitle = '2025 BMX European Championship Day 1';
    const titleLower = videoTitle.toLowerCase();

    const hasBmx = titleLower.includes('bmx');
    const hasEuropean = titleLower.includes('european');

    expect(hasBmx && hasEuropean).toBe(true);
  });

  it('should calculate date range correctly', () => {
    const eventDate = new Date('2025-04-20');
    const dayBefore = new Date(eventDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(eventDate);
    dayAfter.setDate(dayAfter.getDate() + 1);

    expect(dayBefore.toISOString().split('T')[0]).toBe('2025-04-19');
    expect(dayAfter.toISOString().split('T')[0]).toBe('2025-04-21');
  });

  it('should generate appropriate search terms', () => {
    const eventTitle = 'UEC BMX European Cup Round 5';
    const eventYear = 2025;

    const searchTerms = [
      `${eventTitle} ${eventYear}`,
      `UEC BMX European Cup ${eventYear}`,
      `BMX European Cup Round`
    ];

    expect(searchTerms[0]).toBe('UEC BMX European Cup Round 5 2025');
    expect(searchTerms[1]).toBe('UEC BMX European Cup 2025');
    expect(searchTerms[2]).toBe('BMX European Cup Round');
  });

  it('should filter out short words and common terms', () => {
    const eventTitle = 'UEC BMX European Cup Round 1 in Zolder';
    const keywords = eventTitle
      .toLowerCase()
      .split(/[\s\-]+/)
      .filter((w: string) => w.length >= 3 && !['european', 'round'].includes(w));

    expect(keywords).not.toContain('in');
    expect(keywords).toContain('uec');
    expect(keywords).toContain('bmx');
    expect(keywords).toContain('zolder');
    expect(keywords).toContain('cup');
  });

  it('should match UEC in video titles', () => {
    const videoTitle = '2025 UEC BMX Championships';
    const titleLower = videoTitle.toLowerCase();

    expect(titleLower.includes('uec')).toBe(true);
    expect(titleLower.includes('bmx')).toBe(true);
  });
});
