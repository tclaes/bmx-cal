## Releases and app updates

Every deploy publishes `/version.json`. The running app compares its own version with that file when it starts, when it comes back to the foreground (at most once a minute) and every 30 minutes. It then shows one of three things:

| Situation | What the user sees |
|-----------|--------------------|
| Running version = deployed version | Nothing |
| Running version < deployed version, but ≥ the minimum | A dismissible "new version" banner. Dismissing it hides it for that version only |
| Running version < the minimum, and the deployed version meets the minimum | A blocking screen with one "Update now" button |

After an update, the release notes of the new version are shown once in the user's language. First-time visitors never see them.

If `/version.json` cannot be fetched or is not valid JSON (offline, or the SPA fallback answering with HTML), the app shows nothing and keeps working.

### Where the release is defined

`src/config/release.json`:

```json
{
  "version": "1.4.0",
  "minVersion": "1.0.0",
  "notes": { "nl": "…", "fr": "…", "en": "…" }
}
```

- `version`: the version being deployed (`x.y.z`). Keep `package.json` `version` equal; a unit test fails otherwise.
- `minVersion`: users below this version get the blocking screen. It must be ≤ `version`.
- `notes`: shown once after the update. Leave a language out (or the whole object empty) to show nothing.

The build (`vite.config.ts`, plugin `release-manifest`) writes `dist/version.json` and stamps the version into `dist/sw.js`. The service worker cache is therefore renamed on every release and old caches are deleted.

### Feature release (optional update)

1. Bump `version` (minor, for example `1.3.0` → `1.4.0`) in `release.json` and `package.json`.
2. Write `notes` in nl/fr/en.
3. Leave `minVersion` unchanged.
4. Merge and deploy.

### Crucial bug fix (mandatory update)

1. Bump `version` (patch, for example `1.4.0` → `1.4.1`) in `release.json` and `package.json`.
2. Set `minVersion` to the same version (`1.4.1`).
3. Write `notes`.
4. Merge and deploy. Everyone on an older version gets the blocking screen at their next check.

### Emergency: force an update without a new build

Use this when the fix is already deployed but was released as optional, or when a running version turns out to be broken. In the Supabase SQL editor:

```sql
update public.app_release_policy
set min_version = '1.4.1',
    message = '{"nl": "Belangrijke oplossing. Werk de app bij.", "fr": "Correctif important. Mettez l''application à jour.", "en": "Important fix. Please update the app."}'
where id = 1;
```

- The effective minimum is the higher of `minVersion` in `/version.json` and this override.
- The `message` replaces the generic text on the blocking screen. It is optional (`null`).
- An override **higher than the deployed version** is ignored, because updating could not satisfy it. That way a typo cannot lock everyone out.
- Only admins can change the row through the API (RLS). The SQL editor always works.

Clear the override again once it is no longer needed:

```sql
update public.app_release_policy set min_version = null, message = null where id = 1;
```

### Checking a deploy

```bash
curl -s https://bmxkalender.be/version.json
```

```bash
curl -sI https://bmxkalender.be/version.json | grep -i -E "content-type|cache-control"
```

Expect the new version, `content-type: application/json` and `cache-control: no-cache, no-store, must-revalidate` (from `public/_headers`). If the response is HTML, the file is missing from the build.

### Rollback

Redeploy the previous build. Users who already run the newer version see no prompt, because their version is higher than the deployed one. They return to the old version on their next page load. Clear the override if you set one.
