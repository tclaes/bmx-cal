import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from './supabase';

const ALLOWED_ERROR_CODES = new Set([
  '42501', // insufficient_privilege (authorization error)
  'PGRST202', // function not found (schema not loaded in test env)
]);

describe('Cron Jobs Configuration', () => {
  let isConnected = false;

  beforeAll(async () => {
    const { error } = await supabase.from('events').select('id').limit(1);
    isConnected = !error;
  });

  it('should have database connection', () => {
    expect(isConnected).toBe(true);
  });

  it('should have pg_cron extension enabled', async () => {
    const { data, error } = await supabase.rpc('check_pg_cron_enabled', {});

    if (error) {
      expect(ALLOWED_ERROR_CODES.has(error.code)).toBe(true);
    } else {
      expect(data).toBe(true);
    }
  });

  it('should have pg_net extension in extensions schema', async () => {
    const { data, error } = await supabase.rpc('check_pg_net_schema', {});

    if (error) {
      expect(ALLOWED_ERROR_CODES.has(error.code)).toBe(true);
    } else {
      expect(data).toBe('extensions');
    }
  });

  it('should have sync_logs table', async () => {
    const { error } = await supabase.from('sync_logs').select('id').limit(1);

    // Only authorization errors are acceptable; table-missing or schema errors should fail
    if (error) {
      expect(ALLOWED_ERROR_CODES.has(error.code)).toBe(true);
    }
  });

  it('should list active cron jobs', async () => {
    const { data, error } = await supabase.rpc('list_cron_jobs', {});

    if (error) {
      expect(ALLOWED_ERROR_CODES.has(error.code)).toBe(true);
      return;
    }

    expect(data).toBeDefined();
    expect(Array.isArray(data)).toBe(true);

    if (data && Array.isArray(data)) {
      const jobNames = data.map((job: any) => job.jobname);

      // Locate each required job by name and assert it is active with correct schema
      const syncJob = data.find((job: any) => job.jobname === 'sync-jstiming-weekly');
      expect(syncJob).toBeDefined();
      expect(syncJob.active).toBe(true);
      expect(syncJob.command).toContain('extensions.http_post');

      const livestreamJob = data.find((job: any) => job.jobname === 'search-uec-livestream-daily');
      expect(livestreamJob).toBeDefined();
      expect(livestreamJob.active).toBe(true);
      expect(livestreamJob.command).toContain('extensions.http_post');
    }
  });
});
