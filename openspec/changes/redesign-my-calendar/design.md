# Design

## Context

Observed in the code (not assumptions):
- `MyEventsPage` already uses most tokens, but keeps `color-mix(in srgb, var(--type-color) ..., white)`, `color: white` and an SVG check with `stroke="white"`; the type colour comes from `event_type.color_code`.
- The database `color_code` values are the old Tailwind colours (CV `#f59e0b`, TC `#10b981`, CW `#3b82f6`, 3NC `#8b5cf6`, EC `#ef4444`, WC `#ec4899`, Dare2Race `#ce4589`, Training `#06b6d4`). The design tokens use other colours: CV yellow, TC light blue, CW red, 3NC white, EC blue, WC white with rainbow stripe. CW and EC are swapped, and TC / WC need a striped label that one hex cannot express.
- `MyEventsDemoPage` has `linear-gradient(145deg, #f0f7ff, #e8f2ff)` on its CTA card, `color: white` on cyan buttons, and shows the type as plain text.
- There is no reference image for this page; the Startlicht bottom navigation only names the tab. The page therefore follows the calendar's anatomy (row, chip, hero surface).
- `RaceRow` (with save slot), `race-view` helpers and `/events/:id` come from `redesign-calendar-screens`.

## Goals / Non-Goals

**Goals:** one visual language for race types on every public and personal page; no light-theme leftovers; the demo previews the real page.
**Non-Goals:** removing or migrating `color_code` (admin and team-manager still edit it), new selection or notification behaviour, a light theme.

## Decisions

- **Tokens are the single source of truth for type identity (option A).** Display goes through `getRaceTypeKey` / `TypeLabel`; `color_code` is ignored in these pages. Alternatives: update `color_code` in the database (rejected: cannot express stripe patterns, and two sources of truth remain); hybrid per type (rejected: unknown types would look different per page).
- **Extract `TypeChip` into `src/libs/ui`.** The calendar filter chip and the select-by-type chip are the same shape (dot or label, code, optional count, pressed / partial state). One component, used by `EventFilters` and `MyEventsPage`, keeps them from diverging again. It stays presentational (no stores).
- **Rows reuse `RaceRow`.** The star is the selection control, the same as on the calendar; the row link goes to `/events/:id`. This replaces the whole-row toggle button, which removes the conflict between "tap to select" and "tap to open". Trade-off: selection now takes a precise tap on the star instead of the whole row; the star keeps a 44px target.
- **Partly selected state is shown on the chip** with a minus mark and `aria-pressed="mixed"`.
- **Demo page** keeps its sections (hero, preview, steps, FAQ) but the preview list is built from the same `RaceRow` anatomy with static sample data; the CTA card uses `--hero-bg` and `--color-accent` buttons with `--color-text-on-accent`.
- **No hex fallbacks** in `SavedCalendarsList` or the modal; tokens only. A grep for `#[0-9a-f]{3,8}` and `white` in `src/features/my-events` must be empty at the end.

## Risks / Trade-offs

- **Selection feels different** (star instead of whole row) → keep the same star as on the calendar so it is learned once; check on a phone through Bolt.
- **`color_code` stays in the database and admin UI** and may be mistaken for the live colour → noted here; follow-up change can remove the field once nothing reads it.
- **Missing reference design** → review the result on a phone against the calendar screens before the change is archived.
- **Long lists** (45+ events with select controls) → rows stay lightweight; no virtualisation needed at this size.
