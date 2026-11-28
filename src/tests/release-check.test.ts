import { describe, it, expect } from 'vitest';
import { spawnSync } from 'node:child_process';
import { checkRelease, compareVersions, isAllowedSource } from '../../scripts/release-check.mjs';

const release = (headRef: string, baseVersion: string, headVersion: string) =>
  checkRelease({ headRef, baseVersion, headVersion });

describe('compareVersions', () => {
  it('compares each part numerically', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0);
    expect(compareVersions('1.0.10', '1.0.9')).toBeGreaterThan(0);
    expect(compareVersions('2.0.0', '1.99.99')).toBeGreaterThan(0);
    expect(compareVersions('1.2.3', '1.2.3')).toBe(0);
    expect(compareVersions('1.2.3', '1.3.0')).toBeLessThan(0);
  });

  it('rejects anything that is not x.y.z', () => {
    expect(() => compareVersions('1.2', '1.0.0')).toThrow('not a plain x.y.z version');
    expect(() => compareVersions('v1.0.0', '1.0.0')).toThrow();
  });

  it('limits each part to nine digits so the comparison stays exact', () => {
    expect(compareVersions('1.0.999999999', '1.0.999999998')).toBeGreaterThan(0);
    expect(compareVersions('999999999.0.0', '999999998.0.0')).toBeGreaterThan(0);
  });

  it.each(['1234567890.0.0', '0.1234567890.0', '0.0.1234567890'])('rejects %s (a part over nine digits)', (version) => {
    expect(() => compareVersions(version, '1.0.0')).toThrow('not a plain x.y.z version');
  });
});

describe('isAllowedSource', () => {
  it.each(['development', 'hotfix/login', 'hotfix/fix-1.2'])('allows %s', (ref) => {
    expect(isAllowedSource(ref)).toBe(true);
  });

  it.each(['feat/x', 'fix/y', 'master', 'hotfix/', 'hotfix', 'development-old', 'claude/abc'])('rejects %s', (ref) => {
    expect(isAllowedSource(ref)).toBe(false);
  });
});

describe('checkRelease', () => {
  it.each([
    ['patch', '1.0.0', '1.0.1'],
    ['minor', '1.0.0', '1.1.0'],
    ['major', '1.4.2', '2.0.0'],
  ])('passes a %s bump from development', (_, base, head) => {
    expect(release('development', base, head)).toEqual([]);
  });

  it('passes a bumped hotfix', () => {
    expect(release('hotfix/login', '1.1.0', '1.1.1')).toEqual([]);
  });

  it('fails an unchanged version and names both versions', () => {
    const [problem] = release('development', '1.1.0', '1.1.0');
    expect(problem).toContain('master has 1.1.0');
    expect(problem).toContain('this PR has 1.1.0');
  });

  it('fails a lowered version', () => {
    expect(release('development', '1.2.0', '1.1.9')).toHaveLength(1);
  });

  it('fails a feature branch and says to target development', () => {
    const problems = release('feat/sticky-nav', '1.0.0', '1.1.0');
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('Target "development" instead');
  });

  it('reports both problems at once', () => {
    expect(release('fix/x', '1.0.0', '1.0.0')).toHaveLength(2);
  });

  it('passes a branch from this repository', () => {
    expect(
      checkRelease({ headRef: 'development', headRepo: 'tclaes/bmx-cal', baseRepo: 'tclaes/bmx-cal', baseVersion: '1.0.0', headVersion: '1.1.0' }),
    ).toEqual([]);
  });

  it('rejects a fork branch named development', () => {
    const problems = checkRelease({
      headRef: 'development',
      headRepo: 'someone/bmx-cal',
      baseRepo: 'tclaes/bmx-cal',
      baseVersion: '1.0.0',
      headVersion: '1.1.0',
    });
    expect(problems).toEqual(['Pull requests into master must come from a branch in tclaes/bmx-cal, not from someone/bmx-cal.']);
    expect(isAllowedSource('hotfix/x', 'someone/bmx-cal', 'tclaes/bmx-cal')).toBe(false);
  });

  it('reports an invalid version instead of throwing', () => {
    expect(release('development', '1.0.0', 'next')).toEqual(['"next" is not a plain x.y.z version']);
  });
});

describe('release-check CLI', () => {
  const run = (env: Record<string, string>) =>
    spawnSync(process.execPath, ['scripts/release-check.mjs'], {
      env: { PATH: process.env.PATH ?? '', HEAD_REF: 'development', BASE_VERSION: '1.0.0', HEAD_VERSION: '1.1.0', ...env },
      encoding: 'utf8',
    });

  it('fails when the repository names are missing instead of treating them as equal', () => {
    const result = run({});
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Missing HEAD_REPO and BASE_REPO');
  });

  it('passes a same-repository release', () => {
    const result = run({ HEAD_REPO: 'tclaes/bmx-cal', BASE_REPO: 'tclaes/bmx-cal' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Release check passed');
  });
});
