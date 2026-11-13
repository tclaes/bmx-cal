export type UpdateState = 'none' | 'optional' | 'mandatory';

export type LocalizedText = Partial<Record<'nl' | 'fr' | 'en', string>>;

/** Release information published by every deployment at /version.json. */
export interface ReleaseManifest {
  version: string;
  minVersion: string;
}

/** Admin override stored in Supabase (app_release_policy). */
export interface ReleaseOverride {
  minVersion: string | null;
  message: LocalizedText | null;
}

export interface UpdateInput {
  running: string;
  deployed: string;
  publishedMin: string;
  overrideMin?: string | null;
  dismissedVersion?: string | null;
}

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export function isValidVersion(value: unknown): value is string {
  return typeof value === 'string' && VERSION_PATTERN.test(value);
}

/**
 * Compare two x.y.z version strings.
 * Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 * A part that is not a whole number (e.g. "3-beta") counts as 0.
 */
export function compareVersions(v1: string, v2: string): number {
  const toParts = (v: string) => v.split('.').map((p) => {
    const n = Number(p);
    return Number.isInteger(n) ? n : 0;
  });
  const parts1 = toParts(v1);
  const parts2 = toParts(v2);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] ?? 0;
    const part2 = parts2[i] ?? 0;

    if (part1 > part2) return 1;
    if (part1 < part2) return -1;
  }

  return 0;
}

/**
 * Only the fields the update decision uses are validated. Release notes are read from the
 * bundle (RELEASE_NOTES), not from the manifest, so a malformed notes field cannot disable updates.
 */
export function isValidManifest(value: unknown): value is ReleaseManifest {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return isValidVersion(m.version) && isValidVersion(m.minVersion);
}

/**
 * True when the admin override raises the minimum above the published one. An override above
 * the deployed version is ignored entirely: updating could not satisfy it, and it must not
 * weaken the published minimum.
 */
export function isOverrideActive(
  publishedMin: string,
  overrideMin: string | null | undefined,
  deployed: string,
): overrideMin is string {
  return isValidVersion(overrideMin)
    && compareVersions(overrideMin, publishedMin) > 0
    && compareVersions(overrideMin, deployed) <= 0;
}

/**
 * Decide which update prompt, if any, the running app must show.
 * - mandatory: running is below the effective minimum and the deployed version satisfies it
 * - optional: running is below the deployed version and the user has not dismissed that version
 */
export function resolveUpdateState(input: UpdateInput): UpdateState {
  const { running, deployed, publishedMin, overrideMin, dismissedVersion } = input;

  const effectiveMin = isOverrideActive(publishedMin, overrideMin, deployed) ? overrideMin : publishedMin;

  const belowMin = compareVersions(running, effectiveMin) < 0;
  const deployedSatisfiesMin = compareVersions(deployed, effectiveMin) >= 0;
  if (belowMin && deployedSatisfiesMin) return 'mandatory';

  const behind = compareVersions(running, deployed) < 0;
  if (behind && dismissedVersion !== deployed) return 'optional';

  return 'none';
}


/**
 * Release notes are shown once after the app starts on a newer version than the one
 * last used on this device. First-time visitors (no last seen version) never see them.
 */
export function shouldShowReleaseNotes(
  lastSeenVersion: string | null,
  currentVersion: string,
  notes: string | undefined,
): boolean {
  if (!lastSeenVersion || !notes?.trim()) return false;
  return compareVersions(lastSeenVersion, currentVersion) < 0;
}

/** Narrow an untyped override message to the supported locales. */
export function toLocalizedText(value: unknown): LocalizedText | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const result: LocalizedText = {};
  for (const key of ['nl', 'fr', 'en'] as const) {
    const text = (value as Record<string, unknown>)[key];
    if (typeof text === 'string' && text.trim()) result[key] = text;
  }
  return Object.keys(result).length > 0 ? result : null;
}
