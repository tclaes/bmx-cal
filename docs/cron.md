## Cron Jobs

Two `pg_cron` jobs run automated background tasks. See [CRON_JOBS.md](CRON_JOBS.md) for full details, monitoring queries, and troubleshooting.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `sync-jstiming-weekly` | Every Tuesday 06:00 UTC | Calls `sync-jstiming` edge function |
| `search-uec-livestream-daily` | Every day 08:00 UTC | Calls `search-uec-livestream` edge function |