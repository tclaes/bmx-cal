/**
 * First-party consent for analytics (Google Analytics).
 *
 * Advertising consent is NOT handled here: AdSense requires a Google-certified
 * CMP (IAB TCF v2.2) for users in the EEA/UK/CH. That is Google's own
 * "Privacy & messaging" GDPR message, bridged in `ad-consent.ts`.
 */
export type ConsentStatus = 'granted' | 'denied';

export interface ConsentState {
  analytics: ConsentStatus;
  decidedAt: string | null;
}

type GtagWindow = { gtag?: (...args: unknown[]) => void; dataLayer?: unknown[] };

const STORAGE_KEY = 'bmx-cookie-consent';

const defaultState: ConsentState = {
  analytics: 'denied',
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

/** Push a Google Consent Mode v2 update, creating the gtag shim if needed. */
export function updateGoogleConsent(signals: Record<string, ConsentStatus>): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as GtagWindow;
  if (!w.gtag) {
    w.dataLayer = w.dataLayer || [];
    // gtag must push the `arguments` object, not an array
    w.gtag = function () { w.dataLayer!.push(arguments); };
  }
  w.gtag('consent', 'update', signals);
}

/** Apply the analytics choice to Google Consent Mode v2. */
export function applyConsentToGoogle(state: ConsentState): void {
  updateGoogleConsent({ analytics_storage: state.analytics });
}

function setConsent(analytics: ConsentStatus): ConsentState {
  const state: ConsentState = {
    analytics,
    decidedAt: new Date().toISOString(),
  };
  saveConsent(state);
  applyConsentToGoogle(state);
  return state;
}

export function acceptAll(): ConsentState {
  return setConsent('granted');
}

export function rejectAll(): ConsentState {
  return setConsent('denied');
}
