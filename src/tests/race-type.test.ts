import { describe, it, expect } from 'vitest';
import { getRaceTypeKey, getRaceTypeCode } from '../shared/utils/race-type';

describe('race-type', () => {
  it.each([
    ['Cycling Vlaanderen', 'cv'],
    ['Belgian Cycling', 'tc'],
    ['Wallonie Cycling', 'cw'],
    ['3 Nations Cup', '3nc'],
    ['European Cup', 'ec'],
    ['World Cup', 'wc'],
    ['EC', 'ec'],
    ['3nc', '3nc'],
  ])('maps %s to %s', (input, key) => {
    expect(getRaceTypeKey(input)).toBe(key);
  });

  it('falls back to unknown for types without tokens', () => {
    expect(getRaceTypeKey('Dare2Race')).toBe('unknown');
    expect(getRaceTypeKey('')).toBe('unknown');
    expect(getRaceTypeKey(null)).toBe('unknown');
  });

  it('returns the code for known types and 3 letters for unknown ones', () => {
    expect(getRaceTypeCode('European Cup')).toBe('EC');
    expect(getRaceTypeCode('Training')).toBe('TRA');
  });
});
