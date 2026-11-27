import { describe, it, expect } from 'vitest';
import {
  compareVersions,
  shouldShowReleaseNotes,
  toLocalizedText,
  pickLocalized,
  isValidManifest,
  isValidVersion,
  isOverrideActive,
  resolveUpdateState,
} from '@shared/utils/version-checker';

describe('compareVersions', () => {
  it('orders versions numerically per part', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBe(1);
    expect(compareVersions('1.2.3', '1.2.4')).toBe(-1);
    expect(compareVersions('2.0.0', '2.0.0')).toBe(0);
  });

  it('treats missing parts as 0', () => {
    expect(compareVersions('1.0', '1.0.0')).toBe(0);
  });

  it('treats a part with a suffix as 0, not as its numeric prefix', () => {
    expect(compareVersions('1.2.3-beta', '1.2.3')).toBe(-1);
  });

  it('treats non-numeric parts as 0 instead of NaN', () => {
    expect(compareVersions('1.x.0', '1.0.0')).toBe(0);
    expect(compareVersions('abc', '0.0.1')).toBe(-1);
  });
});

describe('isValidVersion / isValidManifest', () => {
  it('accepts x.y.z only', () => {
    expect(isValidVersion('1.2.3')).toBe(true);
    expect(isValidVersion('1.2')).toBe(false);
    expect(isValidVersion('<html>')).toBe(false);
    expect(isValidVersion(null)).toBe(false);
  });

  it('does not reject a manifest over its notes, which the decision never reads', () => {
    expect(isValidManifest({ version: '1.4.0', minVersion: '1.0.0', notes: null })).toBe(true);
    expect(isValidManifest({ version: '1.4.0', minVersion: '1.0.0', notes: ['x'] })).toBe(true);
  });

  it('accepts a complete manifest', () => {
    expect(isValidManifest({ version: '1.4.0', minVersion: '1.0.0', notes: { nl: 'x' } })).toBe(true);
    expect(isValidManifest({ version: '1.4.0', minVersion: '1.0.0' })).toBe(true);
  });

  it('rejects a manifest that requires a version newer than itself', () => {
    expect(isValidManifest({ version: '1.4.0', minVersion: '1.5.0' })).toBe(false);
  });

  it('rejects version parts longer than 9 digits', () => {
    expect(isValidVersion('1.2.123456789')).toBe(true);
    expect(isValidVersion('1.2.1234567890')).toBe(false);
  });

  it('rejects invalid manifests', () => {
    expect(isValidManifest(null)).toBe(false);
    expect(isValidManifest('<!doctype html>')).toBe(false);
    expect(isValidManifest({ version: '1.4.0' })).toBe(false);
    expect(isValidManifest({ version: 'latest', minVersion: '1.0.0' })).toBe(false);
  });
});

describe('resolveUpdateState', () => {
  it('feature release → optional', () => {
    expect(resolveUpdateState({ running: '1.3.0', deployed: '1.4.0', publishedMin: '1.0.0' })).toBe('optional');
  });

  it('crucial fix → mandatory', () => {
    expect(resolveUpdateState({ running: '1.3.0', deployed: '1.3.1', publishedMin: '1.3.1' })).toBe('mandatory');
  });

  it('up to date → none', () => {
    expect(resolveUpdateState({ running: '1.4.0', deployed: '1.4.0', publishedMin: '1.4.0' })).toBe('none');
  });

  it('running newer than deployed (rollback) → none', () => {
    expect(resolveUpdateState({ running: '1.5.0', deployed: '1.4.0', publishedMin: '1.0.0' })).toBe('none');
  });

  it('override higher than published minimum → mandatory', () => {
    expect(resolveUpdateState({
      running: '1.3.0', deployed: '1.4.0', publishedMin: '1.2.0', overrideMin: '1.4.0',
    })).toBe('mandatory');
  });

  it('override lower than published minimum → published minimum applies', () => {
    expect(resolveUpdateState({
      running: '1.3.0', deployed: '1.4.0', publishedMin: '1.4.0', overrideMin: '1.2.0',
    })).toBe('mandatory');
    expect(resolveUpdateState({
      running: '1.3.0', deployed: '1.4.0', publishedMin: '1.0.0', overrideMin: '1.2.0',
    })).toBe('optional');
  });

  it('override higher than deployed does not weaken a published mandatory minimum', () => {
    expect(resolveUpdateState({
      running: '1.3.0', deployed: '1.3.1', publishedMin: '1.3.1', overrideMin: '2.0.0',
    })).toBe('mandatory');
  });

  it('override higher than deployed → never blocks', () => {
    expect(resolveUpdateState({
      running: '1.4.0', deployed: '1.4.0', publishedMin: '1.0.0', overrideMin: '2.0.0',
    })).toBe('none');
    expect(resolveUpdateState({
      running: '1.3.0', deployed: '1.4.0', publishedMin: '1.0.0', overrideMin: '2.0.0',
    })).toBe('optional');
  });

  it('invalid override is ignored', () => {
    expect(resolveUpdateState({
      running: '1.3.0', deployed: '1.4.0', publishedMin: '1.0.0', overrideMin: 'oops',
    })).toBe('optional');
  });

  it('dismissed for the deployed version → none', () => {
    expect(resolveUpdateState({
      running: '1.3.0', deployed: '1.4.0', publishedMin: '1.0.0', dismissedVersion: '1.4.0',
    })).toBe('none');
  });

  it('dismissed an older version → optional again for the newer one', () => {
    expect(resolveUpdateState({
      running: '1.3.0', deployed: '1.5.0', publishedMin: '1.0.0', dismissedVersion: '1.4.0',
    })).toBe('optional');
  });

  it('dismissal never hides a mandatory update', () => {
    expect(resolveUpdateState({
      running: '1.3.0', deployed: '1.3.1', publishedMin: '1.3.1', dismissedVersion: '1.3.1',
    })).toBe('mandatory');
  });
});

describe('isOverrideActive', () => {
  it('is true only when the override raises the minimum', () => {
    expect(isOverrideActive('1.0.0', '1.2.0', '1.4.0')).toBe(true);
    expect(isOverrideActive('1.2.0', '1.0.0', '1.4.0')).toBe(false);
    expect(isOverrideActive('1.2.0', null, '1.4.0')).toBe(false);
  });

  it('ignores an override above the deployed version', () => {
    expect(isOverrideActive('1.0.0', '2.0.0', '1.4.0')).toBe(false);
    expect(isOverrideActive('1.0.0', '1.4.0', '1.4.0')).toBe(true);
  });
});

describe('shouldShowReleaseNotes', () => {
  it('never shows notes on a first visit', () => {
    expect(shouldShowReleaseNotes(null, '1.4.0', 'Nieuw')).toBe(false);
  });

  it('does not show empty notes', () => {
    expect(shouldShowReleaseNotes('1.3.0', '1.4.0', undefined)).toBe(false);
    expect(shouldShowReleaseNotes('1.3.0', '1.4.0', '   ')).toBe(false);
  });

  it('shows notes after updating from an older version', () => {
    expect(shouldShowReleaseNotes('1.3.0', '1.4.0', 'Nieuw')).toBe(true);
  });

  it('does not show notes again for the same or an older version', () => {
    expect(shouldShowReleaseNotes('1.4.0', '1.4.0', 'Nieuw')).toBe(false);
    expect(shouldShowReleaseNotes('1.5.0', '1.4.0', 'Nieuw')).toBe(false);
  });
});

describe('pickLocalized', () => {
  it('prefers the requested language, then en, nl, fr', () => {
    expect(pickLocalized({ nl: 'Fix', en: 'Fix EN' }, 'nl')).toBe('Fix');
    expect(pickLocalized({ nl: 'Fix', en: 'Fix EN' }, 'fr')).toBe('Fix EN');
    expect(pickLocalized({ fr: 'Correctif' }, 'nl')).toBe('Correctif');
  });

  it('returns undefined without any text', () => {
    expect(pickLocalized(null, 'nl')).toBeUndefined();
    expect(pickLocalized({}, 'nl')).toBeUndefined();
  });
});

describe('toLocalizedText', () => {
  it('keeps only non-blank strings for supported locales', () => {
    expect(toLocalizedText({ nl: 'Fix', fr: '  ', en: 42, de: 'Hallo' })).toEqual({ nl: 'Fix' });
  });

  it('returns null for anything that is not a usable object', () => {
    expect(toLocalizedText(null)).toBeNull();
    expect(toLocalizedText('Fix')).toBeNull();
    expect(toLocalizedText(['Fix'])).toBeNull();
    expect(toLocalizedText({ nl: '' })).toBeNull();
  });
});
