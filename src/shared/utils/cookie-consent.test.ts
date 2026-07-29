import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadConsent,
  saveConsent,
  hasDecided,
  acceptAll,
  rejectAll,
  applyConsentToGoogle,
} from './cookie-consent';

describe('cookie-consent', () => {
  beforeEach(() => {
    localStorage.clear();
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
  });

  it('defaults to denied with no decision', () => {
    const state = loadConsent();
    expect(state.analytics).toBe('denied');
    expect(state.ads).toBe('denied');
    expect(hasDecided(state)).toBe(false);
  });

  it('persists and reloads consent', () => {
    saveConsent({ analytics: 'granted', ads: 'denied', decidedAt: '2026-01-01T00:00:00Z' });
    const state = loadConsent();
    expect(state.analytics).toBe('granted');
    expect(state.ads).toBe('denied');
    expect(hasDecided(state)).toBe(true);
  });

  it('acceptAll grants both and records decision', () => {
    const state = acceptAll();
    expect(state.analytics).toBe('granted');
    expect(state.ads).toBe('granted');
    expect(state.decidedAt).not.toBeNull();
    expect(loadConsent().analytics).toBe('granted');
  });

  it('rejectAll denies both and records decision', () => {
    const state = rejectAll();
    expect(state.analytics).toBe('denied');
    expect(state.ads).toBe('denied');
    expect(state.decidedAt).not.toBeNull();
    expect(hasDecided(loadConsent())).toBe(true);
  });

  it('applyConsentToGoogle pushes a consent_update to dataLayer', () => {
    const dataLayer: unknown[] = [];
    (window as unknown as { dataLayer: unknown[]; gtag: undefined }).dataLayer = dataLayer;
    (window as unknown as { gtag: undefined }).gtag = undefined as unknown as typeof window.gtag;
    applyConsentToGoogle({ analytics: 'granted', ads: 'denied', decidedAt: null });
    expect(dataLayer).toHaveLength(1);
    const call = dataLayer[0] as IArguments;
    expect(call[0]).toBe('consent');
    expect(call[1]).toBe('update');
    expect(call[2]).toMatchObject({
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
  });

  it('ignores malformed stored values', () => {
    localStorage.setItem('bmx-cookie-consent', '{not json');
    const state = loadConsent();
    expect(state.analytics).toBe('denied');
    expect(state.ads).toBe('denied');
  });

  it('treats unknown status strings as denied', () => {
    localStorage.setItem(
      'bmx-cookie-consent',
      JSON.stringify({ analytics: 'maybe', ads: 'yes', decidedAt: '2026-01-01' }),
    );
    const state = loadConsent();
    expect(state.analytics).toBe('denied');
    expect(state.ads).toBe('denied');
    expect(hasDecided(state)).toBe(true);
  });

  it('vi is available for spying', () => {
    expect(typeof vi).toBe('object');
  });
});
