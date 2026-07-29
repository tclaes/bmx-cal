import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRegistrationStatus, getFridayBefore } from '@shared/utils/registration-status';

const FUTURE_EVENT_DATE = '2099-06-15';
const PAST_DEADLINE = '2020-01-01';

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${date}`;
}

function makeFutureDeadline(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return toLocalDateStr(d);
}

function makeEventBeforeFriday(): string {
  const friday = new Date();
  friday.setDate(friday.getDate() + 14);
  const sunday = new Date(friday);
  sunday.setDate(friday.getDate() + 2);
  return toLocalDateStr(sunday);
}

describe('getRegistrationStatus', () => {
  it('returns null when no registration_url', () => {
    const result = getRegistrationStatus({
      registration_url: null,
      registration_status: 'open',
      registration_deadline: null,
      registration_opens: null,
      date: FUTURE_EVENT_DATE,
    });
    expect(result).toBeNull();
  });

  it('returns null when today is on or after the Friday before the event', () => {
    const pastDate = '2020-01-05';
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: 'open',
      registration_deadline: null,
      registration_opens: null,
      date: pastDate,
    });
    expect(result).toBeNull();
  });

  it('returns Registration Closed when deadline has passed, even if status is open', () => {
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: 'open',
      registration_deadline: PAST_DEADLINE,
      registration_opens: null,
      date: FUTURE_EVENT_DATE,
    });
    expect(result).not.toBeNull();
    expect(result!.label).toBe('Registration Closed');
    expect(result!.color).toBe('#6b7280');
  });

  it('returns Registration Closed when status is closed and deadline not passed', () => {
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: 'closed',
      registration_deadline: makeFutureDeadline(5),
      registration_opens: null,
      date: FUTURE_EVENT_DATE,
    });
    expect(result!.label).toBe('Registration Closed');
  });

  it('returns Registration Opens Soon when registration_opens is in the future, even if status is open', () => {
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: 'open',
      registration_deadline: makeFutureDeadline(10),
      registration_opens: makeFutureDeadline(3),
      date: FUTURE_EVENT_DATE,
    });
    expect(result!.label).toBe('Registration Opens Soon');
    expect(result!.color).toBe('#b45309');
  });

  it('returns Registration Open when registration_opens is today or in the past', () => {
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: 'open',
      registration_deadline: makeFutureDeadline(10),
      registration_opens: makeFutureDeadline(0),
      date: FUTURE_EVENT_DATE,
    });
    expect(result!.label).toBe('Registration Open');
  });

  it('returns Registration Open when registration_opens is in the past but status is still upcoming', () => {
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: 'upcoming',
      registration_deadline: makeFutureDeadline(10),
      registration_opens: '2026-03-26',
      date: FUTURE_EVENT_DATE,
    });
    expect(result!.label).toBe('Registration Open');
    expect(result!.color).toBe('#047857');
  });

  it('returns Registration Opens Soon when status is upcoming', () => {
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: 'upcoming',
      registration_deadline: null,
      registration_opens: null,
      date: FUTURE_EVENT_DATE,
    });
    expect(result!.label).toBe('Registration Opens Soon');
    expect(result!.color).toBe('#b45309');
  });

  it('returns Registration Open when status is open and deadline is in the future', () => {
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: 'open',
      registration_deadline: makeFutureDeadline(5),
      registration_opens: null,
      date: FUTURE_EVENT_DATE,
    });
    expect(result!.label).toBe('Registration Open');
    expect(result!.color).toBe('#047857');
  });

  it('returns Register Now when status is null and no deadline', () => {
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: null,
      registration_deadline: null,
      registration_opens: null,
      date: FUTURE_EVENT_DATE,
    });
    expect(result!.label).toBe('Register Now');
    expect(result!.color).toBe('#1d4ed8');
  });

  it('returns Registration Closed via deadline fallback when status is null but deadline passed', () => {
    const result = getRegistrationStatus({
      registration_url: 'https://example.com',
      registration_status: null,
      registration_deadline: PAST_DEADLINE,
      registration_opens: null,
      date: FUTURE_EVENT_DATE,
    });
    expect(result!.label).toBe('Registration Closed');
  });
});

describe('getFridayBefore', () => {
  it('returns the Friday before a Sunday event', () => {
    const friday = getFridayBefore('2026-04-12');
    expect(friday.getDay()).toBe(5);
    expect(toLocalDateStr(friday)).toBe('2026-04-10');
  });

  it('returns the Friday before a Saturday event', () => {
    const friday = getFridayBefore('2026-04-11');
    expect(friday.getDay()).toBe(5);
    expect(toLocalDateStr(friday)).toBe('2026-04-10');
  });

  it('returns same day when event is on a Friday', () => {
    const friday = getFridayBefore('2026-04-10');
    expect(friday.getDay()).toBe(5);
    expect(toLocalDateStr(friday)).toBe('2026-04-10');
  });
});
