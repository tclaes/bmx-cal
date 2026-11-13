import { describe, it, expect } from 'vitest';
import release from '../config/release.json';
import pkg from '../../package.json';
import { APP_VERSION, MIN_VERSION } from '@config';

const SEMVER = /^\d+\.\d+\.\d+$/;

describe('release definition', () => {
  it('keeps package.json version equal to release.json', () => {
    expect(pkg.version).toBe(release.version);
  });

  it('uses plain x.y.z versions', () => {
    expect(release.version).toMatch(SEMVER);
    expect(release.minVersion).toMatch(SEMVER);
  });

  it('never requires a version newer than itself', () => {
    const [a, b] = [release.minVersion, release.version].map((v) => v.split('.').map(Number));
    const cmp = a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    expect(cmp).toBeLessThanOrEqual(0);
  });

  it('exposes the release through @config', () => {
    expect(APP_VERSION).toBe(release.version);
    expect(MIN_VERSION).toBe(release.minVersion);
  });
});
