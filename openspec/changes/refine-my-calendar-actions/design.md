# Design

## Context

Observed: `MyEventsPage` renders the count, a "Clear all" button, "Save calendar" and "Export" in one `flex-wrap` row (`.header-actions`); the notification block (`.notif-section`) renders for every signed-in user and `onMount` calls `PushService.isSupported()` and `isSubscribed()`. There is no feature flag mechanism; `src/config` only holds `version.ts` and sheriff allows `config` to depend on nothing. A proposed mockup was agreed in conversation (selection bar, equal actions, undo toast).

## Goals / Non-Goals

**Goals:** a calm, aligned action block; one obvious primary action; a safe way to clear; notifications hidden until they work.
**Non-Goals:** the notification feature, a sticky mobile bar (conflicts with the planned bottom navigation), server-side flags.

## Decisions

- **One selection bar, actions below or beside.** The count and the clear control share a bar; export and save sit in a grid of two equal columns on mobile (stacked, full width) and are right-aligned in the bar from 768px. Alternative (keep one wrapping row) rejected: it is what causes the uneven spacing.
- **Undo instead of a confirm dialog.** Clearing keeps the previous id set in memory for 6 seconds; undo re-applies it through the existing selection functions. Alternative (a `confirm()` dialog) rejected: slower and blocks on mobile; undo also covers mis-taps without friction. The toast is a small local element in the page, not a new global component.
- **Feature flag as a build-time constant.** `src/config/features.ts` exports `features = { notifications: import.meta.env.VITE_FEATURE_NOTIFICATIONS === 'true' }`. Alternatives: a database setting (rejected for now: needs a table, RLS and a loading state for one boolean) and `localStorage` (rejected: per-browser, not a release switch). The flag is checked before any `PushService` call so nothing runs when it is off.
- **Keep translations and handlers in place** so the notifications spec can build on them; only rendering and the `onMount` push check are gated.

## Risks / Trade-offs

- **Env flag needs a rebuild/redeploy to change** → acceptable for a feature that is off until its spec lands; documented in `docs/env.md`.
- **Undo state lost on navigation or reload** → acceptable: the window is 6 seconds and the data is only a local selection.
- **Signed-out users also see the selection bar** (they can select locally) → keep the bar consistent; hide only the save action.
