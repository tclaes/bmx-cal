## Cron Jobs

`pg_cron` jobs run automated background tasks. See [cron-jobs.md](cron-jobs.md) for full details, monitoring queries, and troubleshooting.

| Job | Schedule | Purpose |
|-----|----------|---------|
| `sync-jstiming-weekly` | Every Tuesday 06:00 UTC | Calls `sync-jstiming` edge function |
