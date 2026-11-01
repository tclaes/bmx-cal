import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadConsent,
  saveConsent,
  hasDecided,
  acceptAll,
  rejectAll,
  applyConsentToGoogle,
  updateGoogleConsent,
} from '../layout/cookie-consent';

function lastConsentCall(dataLayer: unknown[]): unknown[] {
  return Array.from(dataLayer[dataLayer.length - 1] as ArrayLike<unknown>);
}

describe('cookie-consent', () => {
  beforeEach(() => {
    localStorage.clear();
    const w = window as unknown as { dataLayer?: unknown[]; gtag?: unknown };
    w.dataLayer = [];
    delete w.gtag;
  });

  it('defaults to denied with no decision', () => {
    const state = loadConsent();
    expect(state.analytics).toBe('denied');
    expect(hasDecided(state)).toBe(false);
  });

  it('persists and reloads consent', () => {
    saveConsent({ analytics: 'granted', decidedAt: '2026-01-01T00:00:00Z' });
    const state = loadConsent();
    expect(state.analytics).toBe('granted');
    expect(hasDecided(state)).toBe(true);
  });

  it('acceptAll grants analytics and records decision', () => {
    const state = acceptAll();
    expect(state.analytics).toBe('granted');
    expect(state.decidedAt).not.toBeNull();
    expect(loadConsent().analytics).toBe('granted');
  });

  it('rejectAll denies analytics and records decision', () => {
    const state = rejectAll();
    expect(state.analytics).toBe('denied');
    expect(state.decidedAt).not.toBeNull();
    expect(hasDecided(loadConsent())).toBe(true);
  });

  it('applyConsentToGoogle only updates analytics_storage', () => {
    const dataLayer: unknown[] = [];
    (window as unknown as { dataLayer: unknown[] }).dataLayer = dataLayer;
    applyConsentToGoogle({ analytics: 'granted', decidedAt: null });
    expect(dataLayer).toHaveLength(1);
    const args = lastConsentCall(dataLayer);
    expect(args[0]).toBe('consent');
    expect(args[1]).toBe('update');
    expect(args[2]).toEqual({ analytics_storage: 'granted' });
  });

  it('updateGoogleConsent forwards arbitrary signals', () => {
    const dataLayer: unknown[] = [];
    (window as unknown as { dataLayer: unknown[] }).dataLayer = dataLayer;
    updateGoogleConsent({ ad_storage: 'denied' });
    expect(lastConsentCall(dataLayer)[2]).toEqual({ ad_storage: 'denied' });
  });

  it('keeps the analytics choice from the old analytics+ads format', () => {
    localStorage.setItem(
      'bmx-cookie-consent',
      JSON.stringify({ analytics: 'granted', ads: 'granted', decidedAt: '2026-01-01' }),
    );
    const state = loadConsent();
    expect(state).toEqual({ analytics: 'granted', decidedAt: '2026-01-01' });
  });

  it('ignores malformed stored values', () => {
    localStorage.setItem('bmx-cookie-consent', '{not json');
    const state = loadConsent();
    expect(state.analytics).toBe('denied');
  });

  it('treats unknown status strings as denied', () => {
    localStorage.setItem(
      'bmx-cookie-consent',
      JSON.stringify({ analytics: 'maybe', decidedAt: '2026-01-01' }),
    );
    const state = loadConsent();
    expect(state.analytics).toBe('denied');
    expect(hasDecided(state)).toBe(true);
  });
});
