# Proposal

## Why

The repo has no root `README.md`. A new developer (or agent) who clones it and runs `npm run dev` gets a blank app, because there is no `.env` and `.env.example` has empty values. The working path, the local Supabase test environment, is documented only in `docs/test-env.md`, and that file assumes the reader already knows to look there. In practice `npm run test-env:start` also fails with `tsx: command not found` until `npm ci` has been run.

## What Changes

- Add a root `README.md`: what the app is, tech stack, prerequisites (Node per `.nvmrc`, Docker), a quick start (`npm ci`, `npm run test-env:start`, `npm run dev:e2e`, open http://localhost:5173), the seeded test accounts, how to sign in without typing credentials, how to stop and reset, the quality-gate commands, and links into `docs/`.
- State the known limits of local mode (edge functions not served, reset mails go to Mailpit).
- Point `docs/test-env.md` and `docs/contribute.md` readers to the README quick start; no duplicated detail beyond the quick start.

Out of scope: changing any script or the test environment, running against a hosted Supabase project, deployment docs (see `docs/releases.md`).

## Capabilities

### New Capabilities
<!-- None: documentation only. Change sets skip_specs: true. -->

### Modified Capabilities
<!-- None. -->

## Impact

- New `README.md` at the repo root
- Small link additions in `docs/test-env.md` and `docs/contribute.md`
- No runtime, database or edge-function behavior changes
