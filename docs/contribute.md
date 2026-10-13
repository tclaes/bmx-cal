## Contributing

When adding new features:

1. Follow the smart/dumb component pattern - smart components in `features/`, dumb in `shared/components/`
2. Place business logic in `shared/services/`, utilities in `shared/utils/`
3. Run `npm run sheriff` to verify module boundaries
4. Run `npm run check` to verify types
5. Run `npm test` to verify tests pass
6. Keep files focused and under 300 lines when possible
7. Make small, focused commits with descriptive messages