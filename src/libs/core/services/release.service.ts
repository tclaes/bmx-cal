import { supabase } from '@data';

const OVERRIDE_TIMEOUT_MS = 3000;
const MANIFEST_TIMEOUT_MS = 5000;

export interface RawReleaseOverride {
  minVersion: string | null;
  message: unknown;
}

function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    Promise.resolve(promise).then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); },
    );
  });
}

export class ReleaseService {
  /**
   * Fetch the published release information. Returns the parsed JSON, or null when it
   * cannot be fetched within 5 seconds or is not JSON (e.g. the SPA fallback answering with index.html).
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
        signal: AbortSignal.timeout(MANIFEST_TIMEOUT_MS),
      });
      if (!response.ok) return null;
      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) return null;
      return await response.json();
    } catch {
      return null;
    }
  }

  /** Fetch the admin override of the minimum version. Returns null on any error or timeout. */
  static async fetchOverride(): Promise<RawReleaseOverride | null> {
    try {
      const { data, error } = await withTimeout(
        supabase
          .from('app_release_policy')
          .select('min_version, message')
          .eq('id', 1)
          .maybeSingle(),
        OVERRIDE_TIMEOUT_MS,
      );
      if (error || !data) return null;
      return { minVersion: data.min_version ?? null, message: data.message ?? null };
    } catch {
      return null;
    }
  }
}
