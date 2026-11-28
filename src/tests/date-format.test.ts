import { describe, it, expect, afterEach } from 'vitest';
import { yearOf } from '@shared/utils';

describe('yearOf', () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    // Assigning undefined would store the string "undefined", so unset it instead.
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it('reads the year from a date', () => {
    expect(yearOf('2026-07-15')).toBe(2026);
  });

  it('reads the year from a date-time', () => {
    expect(yearOf('2025-12-31T23:30:00Z')).toBe(2025);
  });

  it('does not depend on the time zone', () => {
    process.env.TZ = 'America/New_York';
    expect(yearOf('2026-01-01')).toBe(2026);
  });

  it('reads the year from a date-time with an offset', () => {
    expect(yearOf('2026-03-29T10:00:00.000+02:00')).toBe(2026);
  });

  it.each(['01/01/2026', '', '2026-1-01', '2026-01-01junk', '2026-01-01T', '2026-13-01', '2026-02-30', '2025-02-29'])(
    'rejects %j',
    (value) => {
      expect(() => yearOf(value)).toThrow('not an ISO date');
    },
  );

  it('accepts a leap day', () => {
    expect(yearOf('2028-02-29')).toBe(2028);
  });
});
