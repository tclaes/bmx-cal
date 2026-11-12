import { describe, it, expect, vi } from 'vitest';
import {
  getAuthHeader,
  getBearerToken,
  identifyCaller,
  isAdmin,
  isScheduledBearer,
} from '../../supabase/functions/_shared/auth';

const req = (authorization?: string) =>
  new Request('https://x.test/fn', {
    method: 'POST',
    headers: authorization ? { Authorization: authorization } : {},
  });

describe('edge shared auth', () => {
  describe('bearer parsing', () => {
    it('reads the raw header and the token', () => {
      expect(getAuthHeader(req('Bearer abc'))).toBe('Bearer abc');
      expect(getBearerToken(req('Bearer  abc '))).toBe('abc');
    });

    it('matches the scheme case-insensitively and keeps the token case', () => {
      expect(getBearerToken(req('bearer Abc'))).toBe('Abc');
      expect(getBearerToken(req('BEARER Abc'))).toBe('Abc');
      expect(getBearerToken(req('BeArEr   Abc  '))).toBe('Abc');
    });

    it('returns empty strings when absent or not a Bearer header', () => {
      expect(getAuthHeader(req())).toBe('');
      expect(getBearerToken(req())).toBe('');
      expect(getBearerToken(req('Basic abc'))).toBe('');
      expect(getBearerToken(req('Bearer'))).toBe('');
      expect(getBearerToken(req('Bearer '))).toBe('');
      expect(getBearerToken(req('Bearerabc'))).toBe('');
    });
  });

  describe('isAdmin', () => {
    it('is true only for app_metadata.role === admin', () => {
      expect(isAdmin({ id: '1', app_metadata: { role: 'admin' } })).toBe(true);
      expect(isAdmin({ id: '1', app_metadata: { role: 'user' } })).toBe(false);
      expect(isAdmin({ id: '1' })).toBe(false);
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isScheduledBearer', () => {
    const secrets = { serviceRoleKey: 'service-key', cronToken: 'cron-token' };

    it('accepts the service-role key and the cron token', () => {
      expect(isScheduledBearer('service-key', secrets)).toBe(true);
      expect(isScheduledBearer('cron-token', secrets)).toBe(true);
    });

    it('rejects anything else, including an empty bearer', () => {
      expect(isScheduledBearer('anon-key', secrets)).toBe(false);
      expect(isScheduledBearer('', secrets)).toBe(false);
    });

    it('never matches against unset or empty secrets', () => {
      expect(isScheduledBearer('', { serviceRoleKey: '', cronToken: '' })).toBe(false);
      expect(isScheduledBearer('x', {})).toBe(false);
      expect(isScheduledBearer('x', { serviceRoleKey: '', cronToken: '' })).toBe(false);
    });
  });

  describe('identifyCaller', () => {
    const secrets = { serviceRoleKey: 'service-key', cronToken: 'cron-token' };

    it('recognises the scheduler without looking up a user', async () => {
      const getUser = vi.fn();
      const caller = await identifyCaller(req('Bearer cron-token'), { ...secrets, getUser });
      expect(caller).toEqual({ kind: 'scheduled' });
      expect(getUser).not.toHaveBeenCalled();
    });

    it('recognises a scheduler token sent with a lowercase scheme', async () => {
      const getUser = vi.fn();
      const caller = await identifyCaller(req('bearer cron-token'), { ...secrets, getUser });
      expect(caller).toEqual({ kind: 'scheduled' });
      expect(getUser).not.toHaveBeenCalled();
    });

    it('returns the signed-in user otherwise', async () => {
      const user = { id: 'u1', app_metadata: { role: 'admin' } };
      const caller = await identifyCaller(req('Bearer jwt'), { ...secrets, getUser: async () => user });
      expect(caller).toEqual({ kind: 'user', user });
    });

    it('treats a failed user lookup (anon key, bad token, no header) as anonymous', async () => {
      const caller = await identifyCaller(req('Bearer anon-key'), { ...secrets, getUser: async () => null });
      expect(caller).toEqual({ kind: 'anonymous' });
      expect(await identifyCaller(req(), { ...secrets, getUser: async () => null })).toEqual({ kind: 'anonymous' });
    });
  });
});
