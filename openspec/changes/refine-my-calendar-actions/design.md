# Design

## Context

Observed in the code:
- `MyEventsPage` renders the count, "Clear all", "Save calendar" and "Export" in one `flex-wrap` row; the notification block renders for every signed-in user and `onMount` calls `PushService.isSupported()` and `isSubscribed()`.
- `/my-events` has `access: 'authenticated'` with `fallback: MyEventsDemoPage`, so signed-out visitors never reach the real list. The selection stores already handle signed-out users (local storage), and the calendar's save star works signed out.
- Admin is decided by `app_metadata.role = 'admin'` in RLS and in `authStore` (`user.role === 'admin'`). Migrations live in `supabase/migrations/` and are applied through the Supabase MCP `apply_migration` tool. There is no feature flag mechanism.
- `config` may not depend on other modules (sheriff), services may only use `data` and `types`, stores may use `services`.

## Goals / Non-Goals

**Goals:** a calm, aligned action block; one obvious primary action; a safe way to clear; signed-out visitors see their selection but must create an account to export or save; an admin-controlled switch for notifications.
**Non-Goals:** the notification feature, realtime flag updates, a sticky mobile bar (conflicts with the planned bottom navigation), per-user rollouts.

## Decisions

- **Selection bar plus two equal actions.** Count and clear control share a bar; the actions are a two-column grid on mobile (stacked, full width) and right-aligned in the bar from 768px. Rejected: keeping one wrapping row, which causes the uneven spacing.
- **Undo instead of a confirm dialog.** The previous id set is kept in memory for 6 seconds and re-applied through the existing selection functions. The toast is a small local element, not a new global component. Rejected: `confirm()`, slower and blocking on mobile.
- **Open `/my-events` and delete the demo.** Remove `access` and `fallback` from the route and delete `MyEventsDemoPage`, its test and the `myEventsDemo` texts. Signed-out visitors get "Create an account to export" (accent, to `/register`) and a "Sign in" link. Trade-off: the explanatory demo hero and FAQ text disappear; the account action carries one short sentence instead. Alternative (keep the demo) rejected by the user.
- **Flags in a table, not env.** `feature_flags(key text primary key, enabled boolean not null default false, updated_at timestamptz not null default now(), updated_by uuid references auth.users)`. RLS: `select` for `anon` and `authenticated`; `insert`, `update`, `delete` only when `auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'`, matching existing policies. `updated_at` and `updated_by` are set by a trigger so clients cannot spoof them. The migration seeds `('notifications', false)`. Alternatives: a build-time env var (rejected: needs a redeploy and cannot be changed by an admin) and a JSON setting row (rejected: no per-flag audit).
- **Service and store fail closed.** `FeatureFlagService.getAll()` and `setFlag(key, enabled)`; `featureFlags` store holds `{ loaded, flags }`; `isEnabled(key)` is derived and returns false until loaded, when missing or on error. Flags are loaded once at app start (`main.ts` already wires stores); a change reaches visitors on their next load. Rejected: realtime subscriptions, not needed for a rarely changed switch.
- **Gate before any push call.** `MyEventsPage` checks the flag (and sign-in) before rendering the block and before `PushService` calls in `onMount`.
- **Admin UI.** A "Feature flags" collapsible section on `AdminDashboard` listing flags with a toggle (`role="switch"`), reusing the existing section pattern. Only reachable through the existing admin route guard; RLS enforces it server-side.

## Risks / Trade-offs

- **Flag changes need a reload to show** → acceptable for a rarely changed switch; stated in the spec.
- **A new table and policies** → apply the migration through the MCP tool, check with the Supabase security advisor, and cover the policy intent in the spec scenarios.
- **Removing the demo loses the signed-out explanation of the feature** → one sentence in the account action; revisit if sign-ups drop.
- **Signed-out visitors can build a selection they cannot export** → intended; the account action explains why and leads to registration, and their selection is kept when they sign up on the same device.
- **Existing tests and docs reference the demo** → delete the demo test and update `docs/features.md`.
