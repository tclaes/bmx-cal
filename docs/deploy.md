## Frontend hosting and deploys

The frontend is a static Vite build (`dist/`) served by Netlify. Supabase (database, auth, edge functions) is hosted separately and is not affected by where the frontend is deployed.

Build settings are in `netlify.toml`. Response headers are in `public/_headers` and the SPA fallback in `public/_redirects`. Both use Netlify's own file formats and are copied into `dist/` by the build.

### Current setup (bolt.new)

Today the site is published from bolt.new. Bolt runs the Netlify site itself:

- `bmxkalender.be` has an A record to `75.2.60.5` (Netlify's load balancer).
- `www.bmxkalender.be` is a CNAME to `site-dns.bolt.host` and redirects to the apex.
- DNS is hosted at zxcs (`ns.zxcs.nl`, `ns.zxcs.be`, `ns.zxcs.eu`).

Publishing from bolt is a manual step and is not tied to a commit on `master`.

### Target setup (own Netlify site)

A Netlify site in our own account, connected to the GitHub repository:

- Production deploys only from `master`.
- A deploy preview for every pull request.
- One-click rollback to any earlier deploy (see "Rollback" in `docs/releases.md`).
- Build logs for every deploy.

Use one place to deploy from. Once the domain has moved, stop publishing from bolt: a bolt publish goes to the old site, not to `bmxkalender.be`.

### Migration checklist

#### 1. Collect what bolt has

- [ ] Copy the production values of every `VITE_*` variable from the bolt project (see `docs/env.md`).
- [ ] Note the version on `https://bmxkalender.be/version.json`, to compare after the switch.

#### 2. Create the Netlify site

- [ ] In Netlify: **Add new site → Import an existing project → GitHub →** `tclaes/bmx-cal`.
- [ ] Production branch: `master`. Build command and publish folder come from `netlify.toml`.
- [ ] Under **Site configuration → Environment variables**, add for all contexts:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_VAPID_PUBLIC_KEY`
  - `VITE_GA_MEASUREMENT_ID` (production must have it: without it the build leaves out the Google Analytics tag. `netlify.toml` blanks it for previews and branch deploys)
- [ ] Netlify's secrets scan fails the build when the value of a scanned variable (one Netlify treats as a secret) also appears in the repo or build output. The first deploy of this site failed that way on `VITE_SUPABASE_URL` and `VITE_VAPID_PUBLIC_KEY`. `netlify.toml` therefore excludes exactly these four public keys through `SECRETS_SCAN_OMIT_KEYS`, whether or not they are marked as secret. Any other variable is still scanned.
- [ ] Do not add `SUPABASE_SERVICE_ROLE_KEY`. The frontend does not use it, and every `VITE_*` value ends up in the public bundle.
- [ ] Trigger a deploy and test it on `<site>.netlify.app`: sign in, open the calendar, check `/version.json` and its headers (see "Checking a deploy" in `docs/releases.md`).

#### 3. Move the domain

Do this at a quiet moment. Expect a few minutes without a valid certificate.

- [ ] Remove `bmxkalender.be` and `www.bmxkalender.be` from the bolt project. Netlify allows a domain on one site only.
- [ ] In the new Netlify site, **Domain management → Add a domain →** `bmxkalender.be` (set it as primary) and `www.bmxkalender.be`.
- [ ] At zxcs, keep the apex A record at `75.2.60.5`. Change the `www` CNAME from `site-dns.bolt.host` to `<site>.netlify.app`.
- [ ] Wait for Netlify to issue the Let's Encrypt certificate (**Domain management → HTTPS**).
- [ ] Check:

```bash
curl -sI https://bmxkalender.be/ | grep -iE "^(HTTP|server)"
```

```bash
curl -sI https://www.bmxkalender.be/ | grep -iE "^(HTTP|location)"
```

```bash
curl -s https://bmxkalender.be/version.json
```

Expect `server: Netlify`, a 301 from `www` to the apex, and the version noted in step 1 (or newer).

#### 4. Supabase

- [ ] **Authentication → URL Configuration**: keep the Site URL at `https://bmxkalender.be`. Sign-up does not pass `emailRedirectTo`, so confirmation links always go to the Site URL, also when the account was created on a deploy preview. No preview redirect URLs are needed.
- [ ] Password reset links always use the `SITE_URL` secret (see `docs/security-deployment.md`), so they point at production even when requested from a preview.

#### 5. After the switch

- [ ] Stop publishing from bolt.
- [ ] Optionally, in Netlify, make production deploys wait for the GitHub CI checks.

### Deploy previews use production data

`VITE_SUPABASE_URL` is the production project in every context. A deploy preview therefore reads and writes real data. Test destructive changes against the local test environment (`docs/test-env.md`), not on a preview.

### Edge functions and migrations

A Netlify deploy does not deploy them. Migrations are applied as described in `docs/db.md` ("Migrations") and edge functions are deployed as described in `docs/edge-functions.md`, both only after the change is merged to `master`.

#### Release order

Once Netlify deploys from `master`, every merge publishes the frontend straight away. The migrations and edge functions that a frontend change needs must therefore be live before that frontend goes out, or users get errors in between. Use one of these, in this order of preference:

1. **Backend first, in its own PR.** Make the migration or function change backward compatible (add, don't rename or drop), merge it, and deploy it to Supabase. Then merge the frontend PR that uses it. Remove anything old in a later PR, once no deployed frontend uses it.
2. **Hold the frontend publish.** When the change cannot be split, open **Deploys** in Netlify and choose **Lock to stop auto publishing** before merging. Merge, deploy the migrations and edge functions, then publish the new deploy and unlock auto publishing.

A frontend-only or backend-only change needs neither step.
