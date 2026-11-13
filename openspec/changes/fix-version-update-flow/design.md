# Design

## Context

See proposal.md (Why) for the symptoms. This is the current mechanism, as observed in the code:

- `src/config/version.ts` hardcodes `APP_VERSION = '0.3.0'`, `MIN_VERSION`, `FORCE_UPDATE = true` and `RELEASE_NOTES`. `package.json` says `0.0.8`, so there are two version numbers that disagree.
- `src/main.ts` calls `checkForUpdate()`, which compares the **bundled** `APP_VERSION` with `localStorage.app_version`. An update can therefore only be detected after the new bundle is already running, and an old bundle never learns that a new one exists. `forceUpdate` is always `FORCE_UPDATE` (`true`), so every update shows as critical. `MIN_VERSION`, `isVersionOutdated` and `RELEASE_NOTES` are not used anywhere.
- `public/sw.js` serves `/` and `/index.html` cache-first under a hand-bumped `CACHE_NAME = 'bmx-calendar-v6'`. If the name is not bumped, `sw.js` stays byte-identical, the browser never installs a new worker, and reloads keep serving the old `index.html`. The banner then appears again after each reload.
- Several update paths compete: `install` calls `skipWaiting()`, `main.ts` also posts `SKIP_WAITING` on `updatefound`, `activate` posts `SW_UPDATED`, and `UpdatePrompt` waits for a `controllerchange` that may already have happened. The footer and profile "check" sets `available` whenever a worker is waiting, again with `forceUpdate = true`.
- The frontend is deployed via bolt.new as a static build. Checked on 2026-11-13: `bmxkalender.be` responds with `server: Netlify`, so Bolt hosts it on Netlify. Netlify already sends `cache-control: public,max-age=0,must-revalidate` for HTML and `sw.js`. Because of the SPA fallback in `public/_redirects` (`/* /index.html 200`), an unknown path such as `/version.json` currently returns **200 with HTML**. Supabase is used for data, and admin is `auth.jwt().app_metadata.role = 'admin'`.

## Goals / Non-Goals

**Goals:**
- One place to declare a release. The build turns it into both the bundled version and the published manifest.
- Detection that works from an old bundle, with decision logic in one pure, unit-tested function.
- The service worker never serves a stale `index.html` after a deploy.

**Non-Goals:**
- An admin UI for the override (the Supabase dashboard / SQL is enough).
- Gradual or percentage rollouts, or versioning of edge functions.
- Changing push notification behaviour in `sw.js`.

## Decisions

### 1. Release definition: `src/config/release.json`
```json
{ "version": "1.0.0", "minVersion": "1.0.0",
  "notes": { "nl": "…", "fr": "…", "en": "…" } }
```
`src/config/version.ts` re-exports `APP_VERSION` and `RELEASE_NOTES` from it (Vite imports JSON natively). `package.json` `version` is kept equal; a unit test fails when they differ.
*Alternative:* use `package.json` alone. It cannot hold `minVersion` or localised notes, and putting them under a custom key is less discoverable than a dedicated file.

The first release under the new system is **1.0.0**. Every existing install (0.3.0) is then "older", so it gets the new code through the normal flow.

### 2. Build plugin in `vite.config.ts` (inline, no dependency)
A small plugin:
- `generateBundle` emits `version.json` (contents of `release.json` plus `builtAt`).
- `closeBundle` replaces the placeholder `__APP_VERSION__` in `dist/sw.js` with the version (and fails the build if the file or placeholder is missing). Each release therefore produces a byte-different `sw.js` with cache name `bmx-calendar-<version>`, and the hand-bumped name goes away.

*Alternative:* `vite-plugin-pwa` / Workbox. That is more powerful, but it would replace the hand-written push handling in `sw.js` and add a dependency. Too large for this fix.

### 3. No caching of control files, independent of the host
Freshness must not depend on host configuration, because we do not control Bolt's hosting. The client fetches `/version.json?ts=<now>` with `cache: 'no-store'`, and the service worker never intercepts `/version.json`. Netlify's default headers (`max-age=0, must-revalidate`) already prevent stale `index.html` and `sw.js`. We also add `public/_headers` with `Cache-Control: no-cache` for `/version.json`, `/sw.js` and `/index.html` as an extra safeguard. If the host ignores it, nothing breaks.

The manifest is accepted only when the response parses as JSON **and** passes the shape check (`version` and `minVersion` are `x.y.z`). The SPA fallback (HTML with status 200) fails to parse, so it is never read as a release. The content-type header is deliberately not checked: it would only add a failure mode.

### 4. Service worker strategy
- Navigation requests (`request.mode === 'navigate'`): **network-first**, falling back to the cached `/index.html` when offline.
- Hashed `/assets/*`: cache-first (immutable).
- `install`: precache the shell and call `skipWaiting()`. `activate`: delete every cache except the current one, then `clients.claim()`.
- Remove the `SW_UPDATED` message and the `updatefound` → `SKIP_WAITING` handler in `main.ts`. Detection no longer depends on service worker events.

Because navigations are network-first, "update" can simply be: `registration.update()` (best effort, 3 s timeout), then `location.reload()`. No waiting for `controllerchange`, so the button can never hang.

### 5. Decision function (pure)
`resolveUpdateState({ running, deployed, publishedMin, overrideMin, dismissedVersion })` returns `'none' | 'optional' | 'mandatory'`:
1. `effectiveMin = overrideMin` when it is valid, above `publishedMin` and not above `deployed`; otherwise `publishedMin`
2. `running < effectiveMin && deployed >= effectiveMin` → `mandatory`
3. `running < deployed && dismissedVersion !== deployed` → `optional`
4. otherwise `none`

`compareVersions` stays, hardened against prerelease or garbage input (it compares numeric parts and treats non-numeric parts as 0). Invalid manifests are rejected by a shape check; the check then reports `error` and keeps the last known state.

### 6. Update service and store
A new `release.service.ts` in `@core/services` has `fetchManifest()` and `fetchOverride()`. Both return `null` on error, and the override query is limited by a ~3 s timeout so it can never delay startup. `updateStore` (in `pwa.store.ts`) gains `state`, `deployedVersion`, `message` and `check()`. It triggers on load, on `visibilitychange` → visible (throttled to once per minute), and on a 30-minute interval. `dismiss()` writes `update_dismissed_version = deployed` to `localStorage`. Footer and ProfilePage call `check()` and read `state`.

### 7. Supabase override table
```sql
create table public.app_release_policy (
  id smallint primary key default 1 check (id = 1),
  min_version text check (min_version ~ '^\d+\.\d+\.\d+$'),
  message jsonb,            -- {"nl": "...", "fr": "...", "en": "..."} or null
  updated_at timestamptz not null default now()
);
-- RLS: select for anon+authenticated; only UPDATE of min_version/message, only when
-- (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'. Seed one row with min_version null.
```
A single-row table keeps the semantics obvious ("current policy").
*Alternative:* a generic key/value `app_config`. That is more flexible but untyped, and there is no other config to put in it today.

### 8. UI
- `UpdatePrompt.svelte` → optional banner only, as a non-modal native `<dialog open>` (dismissible, never "critical" styling). The app stays usable.
- New `UpdateRequired.svelte`: a native `<dialog>` opened with `showModal()`. The browser puts it in the top layer (above the cookie banner and install prompt without any z-index), makes the rest of the page inert, and focuses the button. `cancel` (Escape) is prevented, and the dialog reopens on `close` while the update is still required. It shows the override message if present, otherwise the generic i18n text. Rendered in `AppLayout`.
- New `WhatsNew.svelte`: on start, if `localStorage.last_seen_version` exists and is lower than `APP_VERSION` and notes exist for the locale, show the notes once. Then always write `last_seen_version = APP_VERSION`.
- Styling only through tokens in `src/styles/variables.css`; touch targets ≥ 44px; strings in nl/fr/en.

## Risks / Trade-offs

- [Clients on 0.3.0 run the old detection code and never fetch `version.json`] → They still pick up 1.0.0. The old service worker updates because `sw.js` changes, its `activate` deletes the old caches, and the next navigation goes to the network. The first mandatory flow works from 1.0.0 onwards.
- [Bolt changes its hosting, or ignores `_headers`] → The client-side `no-store` plus the cache-busting query still guarantees a fresh `version.json`. Verify the headers on the live site after the first deploy.
- [`/version.json` is missing (for example a build without the plugin) and the SPA fallback returns HTML] → The content-type and shape check rejects it, and the state stays `none`.
- [An admin override typo locks out users] → Guarded by the regex check constraint and by the "no unresolvable mandatory" rule (the minimum must be ≤ the deployed version).
- [A Supabase outage delays startup] → The override fetch is non-blocking with a timeout, and the manifest alone decides.
- [Network-first navigation is slower on bad connections] → Only `index.html` (small) is affected. Assets stay cache-first, and offline falls back to the cache.

## Migration Plan

1. Merge the code and the migration. Apply the migration (`app_release_policy`) via Supabase MCP `apply_migration` **before** the frontend deploy. The client tolerates a missing table, so the order does not break anything.
2. Set `release.json` and `package.json` to `1.0.0` with notes, then deploy the frontend.
3. Check `https://bmxkalender.be/version.json` and its response headers.
4. Rollback: redeploy the previous frontend. Clear the override with `update app_release_policy set min_version = null`. Leaving the table in place is harmless.

**Release procedure (to document in `docs/releases.md`):**
- Feature release: bump `version` (minor), write notes, keep `minVersion`, deploy.
- Crucial fix: bump `version` (patch) and set `minVersion` to the same version, then deploy.
- Emergency after deploy: `update app_release_policy set min_version = 'x.y.z', message = '{...}'`, then clear it once no longer needed.
