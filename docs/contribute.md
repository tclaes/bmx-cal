## Contributing

When adding new features:

1. Follow the smart/dumb component pattern - feature pages in `src/features/`, reusable UI in `src/libs/ui/`
2. Place business logic in `src/libs/core/services/`, utilities in `src/shared/utils/`
3. Run `npm run sheriff` to verify module boundaries
4. Run `npm run check` to verify types
5. Run `npm test` to verify tests pass
6. Keep files focused and under 300 lines when possible
7. Make small, focused commits with descriptive messages

## Ignored artifacts

`vite.config.ts.timestamp-*.mjs` files are Vite temp files from crashed runs and can be deleted.
## Colors

Colors are design tokens defined in `src/styles/colors.css` in two tiers:

- **Palette** (`--palette-*`): raw values. Referenced only inside `colors.css`.
- **Semantic** (`--color-*`): role-based aliases of the palette. This is what components use.

Never write a literal color (hex, `rgb()/rgba()/hsl()`, or a named color such as `white`) in a `.svelte`, `.css` or non-test `.ts` file. Use `var(--color-*)` instead. Allowed keywords: `transparent`, `currentColor`, `inherit`, `none`. For a translucent variant use `color-mix(in srgb, var(--color-primary) 10%, transparent)`.

If no token fits, add a semantic token (and a palette entry if needed) in `colors.css`.

Enforced by `npm run stylelint:colors` (runs in CI) and a Vitest guard test (`src/tests/no-color-literals.test.ts`) for TypeScript.
