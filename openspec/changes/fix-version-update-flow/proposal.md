# Proposal

## Why

The app's version system cannot reliably push a new version to users. Every update shows as "critical" because `FORCE_UPDATE` is hardcoded to `true`. The update banner keeps coming back. The minimum version (`MIN_VERSION`) and the release notes are never used. A running (old) bundle only learns about a new version after the new bundle has already loaded, because detection compares the bundled `APP_VERSION` with a copy in `localStorage`. The maintainer needs a dependable way to ship features (optional update) and crucial bug fixes (mandatory update).

## What Changes

- Introduce a single release definition (version, minimum required version, localised release notes) that the build publishes as a static, never-cached `/version.json` manifest and injects into the bundle.
- The running app checks the published manifest on start, when it comes back to the foreground, and periodically. It compares the manifest with its own bundled version, so old clients learn about new releases.
- Add a Supabase override (`app_release_policy`) that lets an admin raise the minimum required version after a deploy without rebuilding. The effective minimum is the highest of the manifest and the override.
- **Mandatory update**: a blocking full-screen overlay with an explanation and a single "Update now" action. It is shown only when the running version is below the effective minimum and a version that satisfies it is actually deployed.
- **Optional update**: a dismissible banner. Dismissing it hides the banner for that release only; a newer release shows it again.
- After an update, show the release notes once in the user's language (nl/fr/en).
- The service worker fetches navigations network-first and derives its cache name from the build version, so reloading always loads the new release and old caches are removed. Remove the competing skip-waiting / `SW_UPDATED` paths.
- **BREAKING (internal)**: remove `FORCE_UPDATE`, `MIN_VERSION`, `RELEASE_NOTES` from `src/config/version.ts` and the `localStorage`-based detection (`checkForUpdate`, `isVersionOutdated`, `storeCurrentVersion` as update trigger).
- Document the release procedure (feature release vs. mandatory fix vs. emergency override).

Out of scope: an admin UI for the override (it is edited in the Supabase dashboard), native app store updates, push notifications about new versions.

## Capabilities

### New Capabilities
- `app-updates`: how the app learns about new releases, how it presents optional and mandatory updates, how users get the new version, and how release notes are shown.

### Modified Capabilities
<!-- None: no existing spec covers versioning or updates. -->

## Impact

- Code: `src/config/version.ts` and `src/config/index.ts`, `src/shared/utils/version-checker.ts`, `src/libs/core/stores/pwa.store.ts`, `src/layout/UpdatePrompt.svelte`, `src/layout/Footer.svelte`, `src/features/profile/ProfilePage.svelte`, `src/main.ts`, `public/sw.js`, `vite.config.ts` (build plugin), i18n locales (nl/fr/en).
- New: release definition file, `/version.json` build output, `public/_headers` (no-cache for `version.json`, `sw.js`, `index.html`), a blocking update overlay, and a "what's new" component.
- Database: new migration for the `app_release_policy` table (public read, admin write) plus an update to `docs/db.md`.
- Tests: rewrite `version-checker`, `update-prompt`, `footer-version-check` and `pwa-functionality` tests for the new decision logic.
- Docs: release procedure in `docs/contribute.md` (or a new `docs/releases.md`).
