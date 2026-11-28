# Design

## Context

- `Navigation.svelte` defines `const locales: Locale[] = ['en', 'nl', 'fr']` locally. It renders the pill group twice: `.locale-switcher` inside `.nav-links` (desktop, 1024px and wider) and `.mobile-locale-switcher` as the last `<li>` of `.mobile-menu`. Both buttons call `locale.setLocale(l)`.
- The desktop pills shrink to 2rem, while the menu pills keep `--touch-target-min` (44px). `.nav-links` uses `align-items: flex-end`, so the pill group needs `align-self: center` to line up.
- `src/i18n/index.ts` exports the `locale` store (`init`, `setLocale`, which persists to `localStorage` under `bmx-locale`) and the `Locale` type. It keeps its `Record<Locale, Translations>` private. `AppLayout.svelte` already sets `<html lang>` from `$locale`.
- Component tests use Vitest with `@testing-library/svelte` in `src/tests/`. Two E2E tests click the pills: `i18n.spec.ts` (desktop, `NL`) and `site-navigation.mobile.spec.ts` (mobile menu, `FR`, after scrolling the menu).

## Goals / Non-Goals

**Goals:**
- One component, used twice, holding every bit of switcher markup and styling.
- The browser's own select behaviour: keyboard, screen readers, and the OS picker on phones.

**Non-Goals:**
- Changing the locale store, detection or persistence.
- Moving the mobile menu itself (#62) or the nav links (#60).

## Decisions

### Component API
`<LanguageSwitcher variant="nav" | "menu" />`. It reads and writes the `locale` store directly, and has no `value` prop or events, because there is only one locale in the app. `Navigation.svelte` keeps only placement: the `<li>` it sits in and its alignment.
- *Alternative: pass `value` and `on:change` from `Navigation`.* Rejected: it moves logic back into the parent for no gain, and #62's extracted menu would have to thread it through again.

### Supported locales exported once
Export `SUPPORTED_LOCALES: readonly Locale[] = ['en', 'nl', 'fr']` from `src/i18n/index.ts`, and use it in both `LanguageSwitcher` and the store's validity check. This replaces the local array in `Navigation.svelte`, so adding a locale later only touches i18n.

### Labels
- `nav` variant: the option text is the code (`EN`, `NL`, `FR`), which keeps the closed control compact.
- `menu` variant: the option text is the language's own name (`English`, `Nederlands`, `Français`). These are endonyms, so they are not translated, and live as a constant in the component.
- The select's accessible name is `aria-label={$t.nav.language}`, with the new key `nav.language`: `Language` / `Taal` / `Langue`. Option `aria-label`s are not used, because screen readers announce option text unevenly. In the nav variant each option also gets `title` set to its endonym, so mouse users see the full name.

### Behaviour
`<select bind:value>` would write the store before `setLocale` persists it. Instead, use `value={$locale}` with `on:change={(e) => locale.setLocale(e.currentTarget.value as Locale)}`, guarding with `SUPPORTED_LOCALES.includes(...)` so an unknown value is ignored.

### Styling (tokens only)
- `appearance: none`, a CSS-drawn chevron using `currentColor` borders (no image), the border and radius tokens used by the current pill group, and `color` and `background-color` from `--color-*` tokens. The native popup is kept.
- `nav`: `min-block-size` matches the nav link's box, compact inline padding and `align-self: center`, so it lines up regardless of `.nav-links { align-items: flex-end }`.
- `menu`: `min-block-size: var(--touch-target-min)`, full width of its row, with a visible text label next to it from `nav.language`.
- Focus: a visible `:focus-visible` outline with the existing focus token.

### Tests
- `src/tests/language-switcher.test.ts`:
  - renders a select named by `nav.language` in each locale, with three options;
  - preselects the current locale;
  - changing it calls `setLocale` and updates `localStorage`;
  - checks the option text per variant.
- E2E:
  - `i18n.spec.ts` uses `page.getByRole('combobox', { name: 'Language' }).selectOption('nl')`;
  - `site-navigation.mobile.spec.ts` keeps its menu-scroll assertions, then selects `fr` from the menu's select instead of clicking the FR button. The short viewport and admin user still make the menu overflow, because the select row is no shorter than the old pill row.
- The axe check in `a11y.spec.ts` covers the new control on public pages.

## Risks / Trade-offs

- [A native select looks a little different on each OS] → Accepted, as the issue asks. The closed state is styled; only the popup is native.
- [Fewer options visible at a glance than the pills] → With three locales the codes are still clear, and the menu variant shows full names.
- [Removing `aria-pressed` buttons changes how screen readers present the control] → A labelled combobox is the standard pattern, and is clearer than three toggles.
- [The mobile-menu E2E depends on the menu overflowing at 480px] → If the new row is shorter and the menu no longer overflows, lower the test viewport height rather than weakening the assertions.
