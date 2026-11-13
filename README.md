# BMX Calendar

A Progressive Web App for discovering, tracking, and managing BMX races, cups, and events across Belgium. Built with Svelte, TypeScript, Vite, and Supabase. Available in Dutch, French and English.

Live site: [bmxkalender.be](https://bmxkalender.be)

## Run it locally

The app needs a Supabase backend. The easiest way is the disposable local stack with seeded data and logins, which never touches production.

### Prerequisites

- Node.js 24 or higher (see `.nvmrc`)
- Docker, running

### Quick start

```sh
npm ci                    # installs everything, including the Supabase CLI and tsx
npm run test-env:start    # starts local Supabase, applies migrations and seed, creates test users
npm run dev:e2e           # serves the app at http://localhost:5173
```

### Test accounts

Password for all: `Test-password-123`

| Role    | Email                |
|---------|----------------------|
| user    | `user@test.local`    |
| manager | `manager@test.local` |
| admin   | `admin@test.local`   |

To skip the login form, run `npm run test-env:login -- admin`, paste the printed `localStorage.setItem(...)` line into the browser console and reload. Sessions last about an hour.

### Stop and reset

```sh
npm run test-env:reset    # back to the seeded state
npm run test-env:stop     # stop the stack and discard its data
```

### Limits of local mode

- Edge functions are not served, so account deletion, push notifications, bug reports and contact mail do not work.
- Password-reset mails arrive in Mailpit at http://127.0.0.1:54324.

More detail: [docs/test-env.md](docs/test-env.md).

### Other scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite dev server against the Supabase project configured in `.env` (see `.env.example`) |
| `npm run preview` | Preview the production build |
| `npm run stylelint:fix` | Auto-fix stylelint issues |
| `npm run test:watch` | Run Vitest in watch mode |

## Quality checks

Pull requests must pass all of these (see [docs/contribute.md](docs/contribute.md)):

```sh
npm run check       # svelte-check + tsc
npm run sheriff     # module boundaries + eslint
npm run stylelint
npm test            # Vitest
npm run build
npm run test:e2e    # Playwright smoke suite against the local stack
```

## Documentation

| Topic | File |
|-------|------|
| Architecture | [docs/architecture.md](docs/architecture.md) |
| Features | [docs/features.md](docs/features.md) |
| Database | [docs/db.md](docs/db.md) |
| Edge functions | [docs/edge-functions.md](docs/edge-functions.md) |
| Environments | [docs/env.md](docs/env.md) |
| Cron jobs | [docs/cron.md](docs/cron.md) |
| File imports | [docs/file-import.md](docs/file-import.md) |
| Coding styles | [docs/coding-styles.md](docs/coding-styles.md) |
| Releases and app updates | [docs/releases.md](docs/releases.md) |

Planned and in-flight changes live in [`openspec/`](openspec/).

## License

MIT
