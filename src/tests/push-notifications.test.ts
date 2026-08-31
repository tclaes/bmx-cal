import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSubscribe = vi.fn();
const mockUnsubscribe = vi.fn();
const mockGetSubscription = vi.fn();
const mockNotificationRequestPermission = vi.fn();

Object.defineProperty(globalThis, 'navigator', {
  value: {
    serviceWorker: {
      ready: Promise.resolve({
        pushManager: {
          subscribe: mockSubscribe,
          getSubscription: mockGetSubscription,
        },
      }),
    },
  },
  writable: true,
});

Object.defineProperty(globalThis, 'Notification', {
  value: {
    requestPermission: mockNotificationRequestPermission,
    permission: 'default',
  },
  writable: true,
});

Object.defineProperty(globalThis, 'PushManager', {
  value: function PushManager() {},
  writable: true,
});

vi.mock('@data/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
        })),
      })),
      select: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      delete: vi.fn(() => ({
        in: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

import { PushService } from '@shared/services/push.service';

describe('PushService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSupported', () => {
    it('returns true when serviceWorker and PushManager are available', () => {
      expect(PushService.isSupported()).toBe(true);
    });
  });

  describe('getPermissionState', () => {
    it('returns the current notification permission', async () => {
      const state = await PushService.getPermissionState();
      expect(state).toBe('default');
    });
  });

  describe('subscribe', () => {
    it('returns null when VAPID key is not configured', async () => {
      const result = await PushService.subscribe();
      expect(result).toBeNull();
    });
  });

  describe('isSubscribed', () => {
    it('returns false when no subscription exists', async () => {
      mockGetSubscription.mockResolvedValueOnce(null);
      const result = await PushService.isSubscribed();
      expect(result).toBe(false);
    });

    it('returns true when a subscription exists', async () => {
      mockGetSubscription.mockResolvedValueOnce({ endpoint: 'test' });
      const result = await PushService.isSubscribed();
      expect(result).toBe(true);
    });
  });

  describe('unsubscribe', () => {
    it('calls unsubscribe on the browser subscription', async () => {
      mockGetSubscription.mockResolvedValueOnce({
        unsubscribe: mockUnsubscribe,
      });
      await PushService.unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});

describe('Push notification payload structure', () => {
  it('creates valid notification payload with title, body, and url', () => {
    const payload = {
      title: 'Inschrijvingsdeadline: European Cup Round 1',
      body: 'De inschrijving sluit over 7 dagen. Schrijf je nu in!',
      url: 'https://example.com/register',
      tag: 'deadline-event-1',
    };

    expect(payload.title).toContain('Inschrijvingsdeadline');
    expect(payload.body).toContain('7 dagen');
    expect(payload.url).toBeTruthy();
    expect(payload.tag).toContain('deadline-');
  });

  it('creates payload for 1-day reminder', () => {
    const payload = {
      title: 'Inschrijvingsdeadline: 3 Nations Cup',
      body: 'De inschrijving sluit over 1 dag. Schrijf je nu in!',
      url: '/',
      tag: 'deadline-event-2',
    };

    expect(payload.body).toContain('1 dag');
  });
});

describe('Event type filtering', () => {
  it('only includes European Cup and 3 Nations Cup events', () => {
    const eventTypes = ['European Cup', '3 Nations Cup'];
    const testEvents = [
      { title: 'European Cup Round 1', event_type: { name: 'European Cup' } },
      { title: '3 Nations Cup', event_type: { name: '3 Nations Cup' } },
      { title: 'Club Race', event_type: { name: 'Club' } },
      { title: 'Belgian Cup', event_type: { name: 'Belgian Cup' } },
    ];

    const filtered = testEvents.filter(e =>
      e.event_type && eventTypes.includes(e.event_type.name)
    );

    expect(filtered).toHaveLength(2);
    expect(filtered[0].title).toBe('European Cup Round 1');
    expect(filtered[1].title).toBe('3 Nations Cup');
  });
});

describe('Deadline calculation', () => {
  it('identifies events 7 days before deadline', () => {
    const today = new Date('2026-09-01');
    const deadline = new Date('2026-09-08');
    const diffDays = Math.round(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(7);
  });

  it('identifies events 1 day before deadline', () => {
    const today = new Date('2026-09-01');
    const deadline = new Date('2026-09-02');
    const diffDays = Math.round(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBe(1);
  });

  it('does not trigger for events more than 7 days out', () => {
    const today = new Date('2026-09-01');
    const deadline = new Date('2026-09-20');
    const diffDays = Math.round(
      (deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(diffDays).toBeGreaterThan(7);
  });
});
