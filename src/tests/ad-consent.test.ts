import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  GOOGLE_VENDOR_ID,
  tcDataToConsentMode,
  isDecisionAvailable,
  watchAdConsent,
  showAdPreferences,
  type TcData,
} from '../layout/ad-consent';

type TestWindow = {
  __tcfapi?: unknown;
  googlefc?: unknown;
  dataLayer?: unknown[];
  gtag?: unknown;
};

const w = window as unknown as TestWindow;

function consents(ids: number[]): Record<string, boolean> {
  return Object.fromEntries(ids.map((id) => [String(id), true]));
}

function tcData(purposes: number[], googleConsent = true, extra: Partial<TcData> = {}): TcData {
  return {
    gdprApplies: true,
    eventStatus: 'useractioncomplete',
    purpose: { consents: consents(purposes) },
    vendor: { consents: googleConsent ? consents([GOOGLE_VENDOR_ID]) : {} },
    ...extra,
  };
}

/** Fake CMP: records the listener so tests can emit TCF events. */
function installFakeCmp() {
  let listener: ((tc: TcData, success: boolean) => void) | undefined;
  const api = vi.fn((command: string, _v: number, cb: (tc: TcData, ok: boolean) => void) => {
    if (command === 'addEventListener') listener = cb;
  });
  w.__tcfapi = api;
  return { api, emit: (tc: TcData) => listener?.({ listenerId: 7, ...tc }, true) };
}

function consentUpdates(): unknown[] {
  return (w.dataLayer ?? [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((args) => args[0] === 'consent' && args[1] === 'update')
    .map((args) => args[2]);
}

describe('ad-consent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    w.dataLayer = [];
    delete w.gtag;
    delete w.__tcfapi;
    delete w.googlefc;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('tcDataToConsentMode', () => {
    it('grants everything when the user accepts all purposes', () => {
      expect(tcDataToConsentMode(tcData([1, 2, 3, 4, 7]))).toEqual({
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    });

    it('denies everything when Google is not an accepted vendor', () => {
      expect(tcDataToConsentMode(tcData([1, 2, 3, 4, 7], false))).toEqual({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    });

    it('maps individual purposes', () => {
      expect(tcDataToConsentMode(tcData([1]))).toEqual({
        ad_storage: 'granted',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
      expect(tcDataToConsentMode(tcData([3, 4]))).toEqual({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'granted',
      });
    });

    it('grants everything when GDPR does not apply', () => {
      expect(tcDataToConsentMode({ gdprApplies: false })).toEqual({
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    });

    it('denies when TC data is empty', () => {
      expect(tcDataToConsentMode({ gdprApplies: true }).ad_storage).toBe('denied');
    });
  });

  it('recognises final TCF event statuses', () => {
    expect(isDecisionAvailable({ eventStatus: 'tcloaded' })).toBe(true);
    expect(isDecisionAvailable({ eventStatus: 'useractioncomplete' })).toBe(true);
    expect(isDecisionAvailable({ eventStatus: 'cmpuishown' })).toBe(false);
  });

  describe('watchAdConsent', () => {
    it('settles and updates consent mode once the user decides', () => {
      const cmp = installFakeCmp();
      const onSettled = vi.fn();
      watchAdConsent(onSettled);

      cmp.emit(tcData([], true, { eventStatus: 'cmpuishown' }));
      expect(onSettled).not.toHaveBeenCalled();

      cmp.emit(tcData([1, 3, 4, 7]));
      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(consentUpdates()).toEqual([
        { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' },
      ]);
    });

    it('keeps syncing later changes but settles only once', () => {
      const cmp = installFakeCmp();
      const onSettled = vi.fn();
      watchAdConsent(onSettled);

      cmp.emit(tcData([1, 3, 4, 7], true, { eventStatus: 'tcloaded' }));
      cmp.emit(tcData([], false));
      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(consentUpdates()).toHaveLength(2);
      expect(consentUpdates()[1]).toEqual({
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    });

    it('attaches when the CMP appears later', () => {
      const onSettled = vi.fn();
      watchAdConsent(onSettled, { pollMs: 100, timeoutMs: 5000 });
      const cmp = installFakeCmp();

      vi.advanceTimersByTime(100);
      expect(cmp.api).toHaveBeenCalledWith('addEventListener', 2.2, expect.any(Function));
      cmp.emit(tcData([1]));
      expect(onSettled).toHaveBeenCalledTimes(1);
    });

    it('settles after the timeout when no CMP is present', () => {
      const onSettled = vi.fn();
      watchAdConsent(onSettled, { timeoutMs: 1000 });
      vi.advanceTimersByTime(999);
      expect(onSettled).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onSettled).toHaveBeenCalledTimes(1);
      expect(consentUpdates()).toHaveLength(0);
    });

    it('cleanup stops the timeout and removes the TCF listener', () => {
      const cmp = installFakeCmp();
      const onSettled = vi.fn();
      const stop = watchAdConsent(onSettled, { timeoutMs: 1000 });
      cmp.emit(tcData([], true, { eventStatus: 'cmpuishown' }));

      stop();
      vi.advanceTimersByTime(2000);
      expect(onSettled).not.toHaveBeenCalled();
      expect(cmp.api).toHaveBeenCalledWith('removeEventListener', 2.2, expect.any(Function), 7);
    });
  });

  describe('showAdPreferences', () => {
    it('calls the CMP directly when it is loaded', () => {
      const showRevocationMessage = vi.fn();
      w.googlefc = { showRevocationMessage };
      expect(showAdPreferences()).toBe(true);
      expect(showRevocationMessage).toHaveBeenCalledTimes(1);
    });

    it('queues the request until the CMP loads', () => {
      expect(showAdPreferences()).toBe(false);
      const fc = w.googlefc as { callbackQueue: Array<() => void>; showRevocationMessage?: () => void };
      expect(fc.callbackQueue).toHaveLength(1);

      fc.showRevocationMessage = vi.fn();
      fc.callbackQueue[0]();
      expect(fc.showRevocationMessage).toHaveBeenCalledTimes(1);
    });
  });
});
