# Automated Background Jobs (Cron Jobs)

This project uses PostgreSQL's `pg_cron` extension to run automated background tasks.

## Overview

A cron job keeps the event data up-to-date:

### 1. JSTiming Sync (Weekly)
- **Name**: `sync-jstiming-weekly`
- **Schedule**: Every Tuesday at 06:00 UTC
- **Function**: `/functions/v1/sync-jstiming`
- **Purpose**: Syncs event data from JSTiming API to keep registration links and event details current

## Configuration

The JSTiming cron job is configured in the database migration:
- `supabase/migrations/20260315205718_fix_cron_jobs_pg_net_schema.sql`

They use `pg_cron.schedule()` to schedule tasks and `extensions.http_post()` to call Edge Functions.

## Monitoring

### Check Active Cron Jobs

```sql
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
ORDER BY jobname;
```

### View Cron Job Execution History

```sql
SELECT
  j.jobname,
  r.runid,
  r.job_pid,
  r.database,
  r.status,
  r.return_message,
  r.start_time,
  r.end_time
FROM cron.job_run_details r
JOIN cron.job j ON j.jobid = r.jobid
ORDER BY r.start_time DESC
LIMIT 20;
```

### Check Sync Logs

```sql
SELECT
  id,
  job_name,
  status,
  message,
  created_at
FROM sync_logs
ORDER BY created_at DESC
LIMIT 10;
```

## Manual Testing

You can manually trigger the edge functions for testing:

### Test JSTiming Sync
```bash
curl -X POST "https://wateawaecktywtlfhomn.supabase.co/functions/v1/sync-jstiming" \
  -H "Authorization: Bearer <YOUR_ANON_KEY>" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### Cron Job Not Running

1. **Check if pg_cron is enabled**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **Check if jobs are active**:
   ```sql
   SELECT jobname, active FROM cron.job;
   ```

3. **View recent errors**:
   ```sql
   SELECT
     j.jobname,
     r.status,
     r.return_message,
     r.start_time
   FROM cron.job_run_details r
   JOIN cron.job j ON j.jobid = r.jobid
   WHERE r.status = 'failed'
   ORDER BY r.start_time DESC
   LIMIT 10;
   ```

### Edge Function Errors

1. **Check Edge Function logs** in Supabase Dashboard:
   - Go to Edge Functions → Logs
   - Filter by function name

2. **Verify secrets are configured**:

### Common Issues

**"pg_net extension not found"**
- This was fixed in migration `20260315205718_fix_cron_jobs_pg_net_schema.sql`
- The migration updates cron jobs to use `extensions.http_post()` instead of `net.http_post()`

**"No UEC events today"**
- This is normal if there are no UEC events scheduled for the current date
- The function only processes events where `date = today`

## Architecture

```
┌─────────────────┐
│   PostgreSQL    │
│    pg_cron      │
│                 │
│  Every Tue 06:00│──────┐
│  Every Day 08:00│──┐   │
└─────────────────┘  │   │
                     │   │
                     ▼   ▼
              ┌──────────────────┐
              │  extensions.     │
              │  http_post()     │
              └──────────────────┘
                     │
                     ▼
              ┌──────────────────┐
              │  Edge Functions  │
              │                  │
              │ • sync-jstiming  │
              └──────────────────┘
                     │
                     ▼
              ┌──────────────────┐
              │   Supabase DB    │
              │                  │
              │ • events         │
              │ • sync_logs      │
              └──────────────────┘
```

## Testing

Run the automated tests:
```bash
npm test -- src/tests/cron-jobs.test.ts
```

This verifies:
- Database connection
- pg_cron extension is enabled
- pg_net is in the extensions schema
- sync_logs table exists
- Cron jobs are configured correctly
