# Tasks

## 1. i18n groundwork

- [x] 1.1 Export `SUPPORTED_LOCALES` from `src/i18n/index.ts`, and use it in `detectLocale` instead of `stored in locales`. Verify `npm test` still passes (the locale and i18n tests).
- [x] 1.2 Add `nav.language` to `src/i18n/types.ts` and to `en.ts` (`Language`), `nl.ts` (`Taal`) and `fr.ts` (`Langue`). Verify `npm run check` passes.

## 2. LanguageSwitcher component

- [x] 2.1 Create `src/layout/LanguageSwitcher.svelte` with the `variant` prop (`nav` | `menu`): a native `<select>` over `SUPPORTED_LOCALES`, `value={$locale}`, `on:change` calling `locale.setLocale` with a guard, `aria-label={$t.nav.language}`, codes in `nav` (with an endonym `title`) and endonyms in `menu` (with a visible label). Styles use tokens only: `appearance: none`, a CSS chevron and `:focus-visible`. Verify `npm run stylelint` passes.
- [x] 2.2 Add `src/tests/language-switcher.test.ts`: the accessible name in en, nl and fr; three options; the current locale preselected; a change updates the store and `localStorage['bmx-locale']`; option text per variant. Verify with `npx vitest run src/tests/language-switcher.test.ts`.

## 3. Use it in the navigation

- [x] 3.1 In `Navigation.svelte`, replace the desktop `.locale-switcher` `<li>` with `<li class="nav-language"><LanguageSwitcher variant="nav" /></li>`, and the `.mobile-locale-switcher` contents with `<LanguageSwitcher variant="menu" />`, keeping that row's separator styling. Remove the local `locales`, `setLocale` and `currentLocale`, and all `.locale-switcher` and `.locale-btn` styles. Verify `grep -n "locale-btn\|locale-switcher" src/layout/Navigation.svelte` finds nothing.
- [x] 3.2 Update `e2e/specs/i18n.spec.ts` to select `nl` through `getByRole('combobox', { name: 'Language' })`. Update `e2e/specs/site-navigation.mobile.spec.ts` to keep its menu-scroll assertions, then select `fr` from the menu's select and assert `<html lang="fr">`. Verify with `npm run test:e2e:mock -- i18n site-navigation`.
- [x] 3.3 Check in the browser at 375, 1023, 1024 and 1280px, in en, nl and fr:
  - the nav select is vertically centred with the links and no taller than them;
  - the menu select is at least 44px tall;
  - keyboard: Tab focuses it with a visible outline, and the language can be changed from the keyboard (typing a letter selects it everywhere; arrow keys follow the platform, and open the popup on macOS).
  Verify with screenshots.

## 4. Final checks

- [x] 4.1 Run `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test`, `npm run build` and `npm run test:e2e:mock` (including the axe checks in `a11y.spec.ts`). Verify all pass.

## Workflow follow-up

- Open the PR against `development`, and archive this change in it before merging.
- #62 (extract the mobile menu) can then reuse `LanguageSwitcher variant="menu"`.
