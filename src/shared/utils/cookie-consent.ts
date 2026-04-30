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
 * Push a Google Consent Mode v2 update.
 * Called on load (default denied) and after the user chooses.
 */
export function applyConsentToGoogle(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  const w = window as unknown as { dataLayer?: unknown[] };
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({
    event: 'consent_update',
    analytics_storage: state.analytics,
    ad_storage: state.ads,
    ad_user_data: state.ads,
    ad_personalization: state.ads,
  });
}

export function acceptAll(): ConsentState {
  const state: ConsentState = {
    analytics: 'granted',
    ads: 'granted',
    decidedAt: new Date().toISOString(),
  };
  saveConsent(state);
  applyConsentToGoogle(state);
  return state;
}

export function rejectAll(): ConsentState {
  const state: ConsentState = {
    analytics: 'denied',
    ads: 'denied',
    decidedAt: new Date().toISOString(),
  };
  saveConsent(state);
  applyConsentToGoogle(state);
  return state;
}
