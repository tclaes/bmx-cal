#!/usr/bin/env node
// Release check for pull requests into master (see docs/releases.md).
//
// A PR into master must come from `development` (a release) or `hotfix/<name>` (a hotfix),
// and must raise `version` in src/config/release.json above the version on master.
//
// Usage (CI passes these as environment variables, never interpolated into the shell):
//   HEAD_REF=development HEAD_REPO=owner/repo BASE_REPO=owner/repo \
//   BASE_VERSION=1.0.0 HEAD_VERSION=1.1.0 node scripts/release-check.mjs

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// Each part is limited to nine digits so Number() stays exact.
const SEMVER = /^(\d{1,9})\.(\d{1,9})\.(\d{1,9})$/;

/** @param {string} version */
function parse(version) {
  const match = SEMVER.exec(version ?? '');
  if (!match) throw new Error(`"${version}" is not a plain x.y.z version`);
  return match.slice(1).map(Number);
}

/**
 * Compares two x.y.z versions numerically.
 * @param {string} a
 * @param {string} b
 * @returns {number} negative if a < b, 0 if equal, positive if a > b
 */
export function compareVersions(a, b) {
  const [x, y] = [parse(a), parse(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
}

/**
 * A release or hotfix must come from a branch in this repository, not from a fork
 * that happens to use the same branch name.
 * @param {string} headRef
 * @param {string} [headRepo] full name of the PR's head repository
 * @param {string} [baseRepo] full name of this repository
 */
export function isAllowedSource(headRef, headRepo, baseRepo) {
  if (headRepo !== undefined && headRepo !== baseRepo) return false;
  return headRef === 'development' || /^hotfix\/.+/.test(headRef ?? '');
}

/**
 * @param {{ headRef: string, baseVersion: string, headVersion: string, headRepo?: string, baseRepo?: string }} input
 * @returns {string[]} problems; empty when the PR may be released
 */
export function checkRelease({ headRef, baseVersion, headVersion, headRepo, baseRepo }) {
  const problems = [];

  if (headRepo !== undefined && headRepo !== baseRepo) {
    problems.push(`Pull requests into master must come from a branch in ${baseRepo}, not from ${headRepo}.`);
  } else if (!isAllowedSource(headRef)) {
    problems.push(
      `Pull requests into master must come from "development" or a "hotfix/<name>" branch, not "${headRef}". Target "development" instead.`,
    );
  }

  try {
    if (compareVersions(headVersion, baseVersion) <= 0) {
      problems.push(
        `src/config/release.json version must be higher than master's: master has ${baseVersion}, this PR has ${headVersion}. Bump it (and package.json): for a release through a chore/release-<version> PR into development, for a hotfix on the hotfix branch.`,
      );
    }
  } catch (error) {
    problems.push(error instanceof Error ? error.message : String(error));
  }

  return problems;
}

const isMain = Boolean(process.argv[1]) && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMain) {
  const { HEAD_REF = '', BASE_VERSION = '', HEAD_VERSION = '', HEAD_REPO = '', BASE_REPO = '' } = process.env;
  // Missing repository names would otherwise compare equal ('' === '') and pass.
  const missing = ['HEAD_REPO', 'BASE_REPO'].filter((name) => !process.env[name]);
  const problems =
    missing.length > 0
      ? [`Missing ${missing.join(' and ')}: the release check needs both repository names.`]
      : checkRelease({
          headRef: HEAD_REF,
          baseVersion: BASE_VERSION,
          headVersion: HEAD_VERSION,
          headRepo: HEAD_REPO,
          baseRepo: BASE_REPO,
        });

  if (problems.length === 0) {
    console.log(`Release check passed: ${HEAD_REF} raises the version ${BASE_VERSION} -> ${HEAD_VERSION}.`);
  } else {
    for (const problem of problems) console.error(`::error::${problem}`);
    process.exit(1);
  }
}
