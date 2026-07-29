import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackPageView, trackEvent } from '@shared/utils/analytics';

describe('analytics', () => {
  let gtagSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    gtagSpy = vi.fn();
    window.gtag = gtagSpy;
    window.dataLayer = [];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('trackPageView', () => {
    it('does not call gtag in dev mode', () => {
      trackPageView('/');
      expect(gtagSpy).not.toHaveBeenCalled();
    });
  });

  describe('trackEvent', () => {
    it('does not call gtag in dev mode', () => {
      trackEvent('navigation', 'click', 'home');
      expect(gtagSpy).not.toHaveBeenCalled();
    });
  });

  describe('when analytics is available', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', false);
      vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST12345');
    });

    it('trackPageView sends config event with page path', () => {
      trackPageView('/my-events');
      expect(gtagSpy).toHaveBeenCalledWith('config', 'G-TEST12345', {
        page_path: '/my-events',
      });
    });

    it('trackEvent sends event with category and action', () => {
      trackEvent('user', 'login');
      expect(gtagSpy).toHaveBeenCalledWith('event', 'login', {
        event_category: 'user',
        event_label: undefined,
        value: undefined,
      });
    });

    it('trackEvent sends event with optional label and value', () => {
      trackEvent('calendar', 'export', 'ical', 1);
      expect(gtagSpy).toHaveBeenCalledWith('event', 'export', {
        event_category: 'calendar',
        event_label: 'ical',
        value: 1,
      });
    });

    it('trackPageView does not throw when gtag is unavailable', () => {
      window.gtag = undefined as unknown as typeof window.gtag;
      expect(() => trackPageView('/about')).not.toThrow();
    });

    it('trackEvent does not throw when gtag is unavailable', () => {
      window.gtag = undefined as unknown as typeof window.gtag;
      expect(() => trackEvent('nav', 'click')).not.toThrow();
    });
  });
});
