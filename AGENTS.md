# Bmx Calendar App

## Tech Stack

- **Svelte 4** - Reactive UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Supabase** - PostgreSQL database, Auth, Edge Functions, and storage
- **Navaid** - Lightweight client-side router
- **Sheriff** - Module boundary enforcement
- **PapaParse** - CSV parsing
- **SheetJS** - Excel parsing
- **Vitest** - Unit testing

## Architecture

references `docs/architecture.md`

## Features

references `docs/features.md`

## Edge functions

references `docs/edge-functions.md`

## Database

references `docs/db.md`

## Environments

references `docs/env.md`

## Cron Jobs

references `docs/cron.md`

## File imports

references `docs/file-import.md`

## Coding styles

references `docs/coding-styles.md`

## Contribute

references `docs/contribute.md`

## Branches and pull requests

Feature and fix pull requests target `development` (`gh pr create --base development`), the default branch. Only release PRs (from `development`) and hotfix PRs (from `hotfix/<name>`) target `master`, and they must bump the version. See "Branches and pull requests" in `docs/contribute.md` and "Release PR" in `docs/releases.md`.

## OpenSpec

Archive each OpenSpec change (`/opsx:archive`, syncing its delta specs) in the PR that implements it, once the implementation is done and before merging, never in a follow-up PR. Later review fixes may follow the archive; keep the main spec in sync. See "OpenSpec changes" in `docs/contribute.md`.

## Local test environment

references `docs/test-env.md`

## Releases and app updates

references `docs/releases.md`

## Frontend hosting and deploys

references `docs/deploy.md`
