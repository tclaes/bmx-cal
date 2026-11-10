export type ConsentStatus = 'granted' | 'denied';

export interface ConsentState {
  analytics: ConsentStatus;
  ads: ConsentStatus;
  decidedAt: string | null;
}

const STORAGE_KEY = 'bmx-cookie-consent';

const defaultState: ConsentState = {
  analytics: 'denied',
  ads: 'denied',
  decidedAt: null,
};

export function loadConsent(): ConsentState {
  if (typeof localStorage === 'undefined') return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    return {
      analytics: parsed.analytics === 'granted' ? 'granted' : 'denied',
      ads: parsed.ads === 'granted' ? 'granted' : 'denied',
      decidedAt: parsed.decidedAt ?? null,
    };
  } catch {
    return defaultState;
  }
}

export function saveConsent(state: ConsentState): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function hasDecided(state: ConsentState): boolean {
  return state.decidedAt !== null;
}

/**
 * Push a Google Consent Mode v2 update via gtag().
 * Called on load (default denied) and after the user chooses.
 */
export function applyConsentToGoogle(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };
  if (!w.gtag) {
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () { w.dataLayer!.push(arguments); };
  }
  w.gtag('consent', 'update', {
    analytics_storage: state.analytics,
    ad_storage: state.ads,
    ad_user_data: state.ads,
    ad_personalization: state.ads,
  });
}

function setConsent(analytics: ConsentStatus, ads: ConsentStatus): ConsentState {
  const state: ConsentState = {
    analytics,
    ads,
    decidedAt: new Date().toISOString(),
  };
  saveConsent(state);
  applyConsentToGoogle(state);
  return state;
}

export function acceptAll(): ConsentState {
  return setConsent('granted', 'granted');
}

export function rejectAll(): ConsentState {
  return setConsent('denied', 'denied');
}
