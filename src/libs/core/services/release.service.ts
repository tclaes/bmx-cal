import { supabase } from '@data';

const OVERRIDE_TIMEOUT_MS = 3000;
const MANIFEST_TIMEOUT_MS = 5000;

/**
 * An AbortSignal that aborts after `ms`. AbortSignal.timeout() is missing in Safari < 16
 * and Chrome < 103, which Vite's default build target still includes.
 */
function timeoutSignal(ms: number): AbortSignal {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), ms);
  return controller.signal;
}

export interface RawReleaseOverride {
  minVersion: string | null;
  message: unknown;
}

export class ReleaseService {
  /**
   * Fetch the published release information. Returns the parsed JSON, or null when it
   * cannot be fetched within 5 seconds or does not parse as JSON (e.g. the SPA fallback's index.html).
   * Shape validation is up to the caller.
   */
  static async fetchManifest(): Promise<unknown | null> {
    try {
      // A hung request would otherwise keep the shared in-flight check pending forever,
      // blocking every later check. Low priority: this background check must not compete
      // with requests the current view needs.
      const response = await fetch(`/version.json?ts=${Date.now()}`, {
        cache: 'no-store',
        priority: 'low',
        signal: timeoutSignal(MANIFEST_TIMEOUT_MS),
      });
      if (!response.ok) return null;
      // The SPA fallback answers unknown paths with index.html; parsing that throws,
      // and the store validates the shape of whatever does parse.
      return await response.json();
    } catch {
      return null;
    }
  }

  /** Fetch the admin override of the minimum version. Returns null on any error or timeout. */
  static async fetchOverride(): Promise<RawReleaseOverride | null> {
    try {
      // Aborting (rather than only stopping to wait) also cancels the request itself.
      const { data, error } = await supabase
        .from('app_release_policy')
        .select('min_version, message')
        .eq('id', 1)
        .abortSignal(timeoutSignal(OVERRIDE_TIMEOUT_MS))
        .maybeSingle();
      if (error || !data) return null;
      return { minVersion: data.min_version ?? null, message: data.message ?? null };
    } catch {
      return null;
    }
  }
}
