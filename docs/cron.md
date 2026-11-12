## Cron Jobs

`pg_cron` jobs run automated background tasks. See [CRON_JOBS.md](CRON_JOBS.md) for full details, monitoring queries, and troubleshooting.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `sync-jstiming-weekly` | Every Tuesday 06:00 UTC | Calls `sync-jstiming` edge function |