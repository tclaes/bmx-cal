import { describe, it, expect, afterEach } from 'vitest';
import { yearOf } from '@shared/utils';

describe('yearOf', () => {
  const originalTz = process.env.TZ;
  afterEach(() => {
    process.env.TZ = originalTz;
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

  it('rejects anything that is not an ISO date', () => {
    expect(() => yearOf('01/01/2026')).toThrow('not an ISO date');
    expect(() => yearOf('')).toThrow();
  });
});
