import { describe, it, expect } from 'vitest';
import { assertLocal } from '../../scripts/test-env/guard';

describe('test-env assertLocal', () => {
  it.each(['http://localhost:54321', 'http://127.0.0.1:54321', 'http://[::1]:54321'])('accepts %s', (url) => {
    expect(() => assertLocal(url)).not.toThrow();
  });

  it.each([
    'https://wateawaecktywtlfhomn.supabase.co',
    'https://localhost.evil.com',
    'http://127.0.0.1.evil.com',
    'not a url',
    '',
    undefined,
  ])('rejects %s', (url) => {
    expect(() => assertLocal(url as string | undefined)).toThrow();
  });
});
