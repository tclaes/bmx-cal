/**
 * Advertising consent via Google's certified CMP.
 *
 * AdSense requires a Google-certified CMP that implements IAB TCF v2.2 for
 * users in the EEA, UK and Switzerland. We use Google's own CMP, enabled in
 * AdSense under "Privacy & messaging" -> "European regulations". It is loaded
 * automatically by the AdSense tag and exposes the standard `window.__tcfapi`.
 *
 * This module:
 *  - mirrors the TCF decision into Google Consent Mode v2 (ad_* signals), and
 *  - lets the user reopen the CMP to change their advertising choices.
 */
import { updateGoogleConsent, type ConsentStatus } from './cookie-consent';

/** Google's vendor ID in the IAB Global Vendor List. */
export const GOOGLE_VENDOR_ID = 755;

export interface TcData {
  gdprApplies?: boolean;
  eventStatus?: string;
  listenerId?: number;
  purpose?: { consents?: Record<string, boolean> };
  vendor?: { consents?: Record<string, boolean> };
}

type TcfApi = (
  command: string,
  version: number,
  callback: (data: TcData, success: boolean) => void,
  parameter?: unknown,
) => void;

type GoogleFc = {
  callbackQueue?: Array<unknown> | { push: (item: unknown) => void };
  showRevocationMessage?: () => void;
};

type CmpWindow = { __tcfapi?: TcfApi; googlefc?: GoogleFc };

export interface AdConsentSignals {
  ad_storage: ConsentStatus;
  ad_user_data: ConsentStatus;
  ad_personalization: ConsentStatus;
}

const status = (granted: boolean): ConsentStatus => (granted ? 'granted' : 'denied');

/**
 * Map a TCF consent string decision to Consent Mode v2 signals, using the
 * mapping Google documents for TCF-based CMPs:
 *  - ad_storage         <- purpose 1
 *  - ad_user_data       <- purposes 1 + 7
 *  - ad_personalization <- purposes 3 + 4
 * All of them additionally require consent for Google as a vendor.
 */
export function tcDataToConsentMode(tc: TcData): AdConsentSignals {
  if (tc.gdprApplies === false) {
    return { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' };
  }
  const purpose = (id: number) => tc.purpose?.consents?.[id] === true;
  const google = tc.vendor?.consents?.[GOOGLE_VENDOR_ID] === true;
  return {
    ad_storage: status(google && purpose(1)),
    ad_user_data: status(google && purpose(1) && purpose(7)),
    ad_personalization: status(google && purpose(3) && purpose(4)),
  };
}

/** True once the CMP has a decision: stored earlier, or just made by the user. */
export function isDecisionAvailable(tc: TcData): boolean {
  return tc.eventStatus === 'tcloaded' || tc.eventStatus === 'useractioncomplete';
}

export interface WatchOptions {
  /** Give up waiting for the CMP after this long (ad blocker, non-EEA, offline). */
  timeoutMs?: number;
  pollMs?: number;
}

/**
 * Wait for the certified CMP, keep Consent Mode in sync with its decisions,
 * and call `onSettled` once: when the first decision is available, or when
 * the CMP did not appear within `timeoutMs`. Returns a cleanup function.
 */
export function watchAdConsent(onSettled: () => void, options: WatchOptions = {}): () => void {
  const { timeoutMs = 4000, pollMs = 200 } = options;
  if (typeof window === 'undefined') return () => {};

  const w = window as unknown as CmpWindow;
  let settled = false;
  let listenerId: number | undefined;
  let api: TcfApi | undefined;

  const settle = () => {
    if (settled) return;
    settled = true;
    clearInterval(poll);
    clearTimeout(timeout);
    onSettled();
  };

  const attach = (tcfapi: TcfApi) => {
    api = tcfapi;
    tcfapi('addEventListener', 2.2, (tc, success) => {
      if (!success || !tc) return;
      if (tc.listenerId !== undefined) listenerId = tc.listenerId;
      if (!isDecisionAvailable(tc)) return;
      updateGoogleConsent({ ...tcDataToConsentMode(tc) });
      settle();
    });
  };

  const tryAttach = () => {
    if (api || typeof w.__tcfapi !== 'function') return;
    clearInterval(poll);
    attach(w.__tcfapi);
  };

  const poll = setInterval(tryAttach, pollMs);
  const timeout = setTimeout(settle, timeoutMs);
  tryAttach();

  return () => {
    settled = true;
    clearInterval(poll);
    clearTimeout(timeout);
    if (api && listenerId !== undefined) {
      api('removeEventListener', 2.2, () => {}, listenerId);
    }
  };
}

/**
 * Reopen Google's CMP so the user can change their advertising choices.
 * Queued until the CMP has loaded. Returns false if the CMP is not on the page
 * yet (e.g. blocked), in which case the request still runs once it loads.
 */
export function showAdPreferences(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as CmpWindow;
  if (typeof w.googlefc?.showRevocationMessage === 'function') {
    w.googlefc.showRevocationMessage();
    return true;
  }
  w.googlefc = w.googlefc || {};
  w.googlefc.callbackQueue = w.googlefc.callbackQueue || [];
  w.googlefc.callbackQueue.push(() => w.googlefc?.showRevocationMessage?.());
  return false;
}
