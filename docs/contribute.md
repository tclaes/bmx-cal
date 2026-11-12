## Contributing

When adding new features:

1. Follow the smart/dumb component pattern - feature pages in `src/features/`, reusable UI in `src/libs/ui/`
2. Place business logic in `src/libs/core/services/`, utilities in `src/shared/utils/`
3. Run `npm run sheriff` to verify module boundaries
4. Run `npm run check` to verify types
5. Run `npm run stylelint` to verify styles
6. Run `npm test` to verify tests pass
7. Keep files focused and under 300 lines when possible
8. Make small, focused commits with descriptive messages

## Ignored artifacts

`vite.config.ts.timestamp-*.mjs` files are Vite temp files from crashed runs and can be deleted.

## CI

Every pull request must pass these gates: `npm run check`, `npm run sheriff`, `npm run stylelint`, `npm test` and `npm run build`. CI installs with `npm ci` and uses the Node version in `.nvmrc` (currently 24).
