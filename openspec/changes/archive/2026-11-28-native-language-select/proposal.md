# Proposal

## Why

The language switcher is an `EN | NL | FR` group of toggle buttons, written out twice in `src/layout/Navigation.svelte`: once in the desktop links (`.locale-switcher`) and once in the mobile menu (`.mobile-locale-switcher`), with about 60 lines of `.locale-btn` styles shared between them (GitHub issue #23). It takes horizontal space in proportion to the number of locales, competes with the nav links and the Sign in button, needs custom `aria-pressed` handling, and has no accessible name beyond a hardcoded English `aria-label`. Because it lives inline twice, it can't be fixed or reused in one place, and it blocks extracting the mobile menu (#62).

## What Changes

- New `src/layout/LanguageSwitcher.svelte`: a native `<select>` listing every supported locale, bound to the current locale, which switches language on change. It owns its markup and styles. `Navigation.svelte` only renders `<LanguageSwitcher variant="nav" />` and `<LanguageSwitcher variant="menu" />`.
- The `nav` variant is compact, matches the nav item height and is vertically centred. The `menu` variant keeps the 44px touch target. Option labels: short codes (`EN`, `NL`, `FR`) in the nav, full language names (`English`, `Nederlands`, `Français`) in the menu.
- The select gets a translated accessible name from a new `nav.language` key (`Language` / `Taal` / `Langue`), replacing the hardcoded `aria-label="Language switcher"`.
- Both `.locale-btn` button groups and their styles are removed from `Navigation.svelte`.
- E2E tests that click the language buttons (`e2e/specs/i18n.spec.ts`, `e2e/specs/site-navigation.mobile.spec.ts`) switch language through the select instead.
- Base branch is `development`. The issue's original target, `feat/redesign-my-calendar`, no longer exists, and its redesign is already on `development`.

Out of scope: adding locales, changing how the locale is detected or persisted (`bmx-locale` in `localStorage`), and a custom (non-native) dropdown.

## Capabilities

### New Capabilities
- `language-switch`: how users see and change the interface language: the control, which locales it offers, its accessible name, and that the choice applies immediately and persists.

### Modified Capabilities

(none)

## Impact

- New `src/layout/LanguageSwitcher.svelte`
- `src/layout/Navigation.svelte`: both switcher copies and the `.locale-btn` styles removed
- `src/i18n/types.ts`, `src/i18n/locales/{en,nl,fr}.ts`: new `nav.language` key
- `e2e/specs/i18n.spec.ts`, `e2e/specs/site-navigation.mobile.spec.ts`; new component tests
- No API, data or dependency changes
