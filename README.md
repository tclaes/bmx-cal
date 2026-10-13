# BMX Calendar

A Progressive Web App for discovering, tracking, and managing BMX races, cups, and events across Belgium. Built with Svelte, TypeScript, Vite, and Supabase.

Live site: [bmxkalender.be](https://bmxkalender.be)

## Getting Started

### Prerequisites

- Node.js 22 or higher

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env` (see [Environment Variables](#environment-variables) below).

3. Start the dev server:
   ```bash
   npm run dev
   ```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview the production build |
| `npm run check` | Type-check with svelte-check and tsc |
| `npm run sheriff` | Verify Sheriff module boundaries |
| `npm run stylelint` | Lint CSS and Svelte styles |
| `npm run stylelint:fix` | Auto-fix stylelint issues |
| `npm test` | Run unit tests with Vitest |
| `npm run test:watch` | Run Vitest in watch mode |

## Contributing

When adding new features:

1. Follow the smart/dumb component pattern - smart components in `features/`, dumb in `shared/components/`
2. Place business logic in `shared/services/`, utilities in `shared/utils/`
3. Run `npm run sheriff` to verify module boundaries
4. Run `npm run check` to verify types
5. Run `npm test` to verify tests pass
6. Keep files focused and under 300 lines when possible
7. Make small, focused commits with descriptive messages

## Troubleshooting

### Build Errors

- Check TypeScript errors: `npm run check`
- Verify Sheriff boundaries: `npm run sheriff`
- Clear cache: `rm -rf node_modules dist && npm install`

### Runtime Errors

- Check browser console for errors
- Verify Supabase connection and environment variables
- Check RLS policies if data is missing or writes fail
- Verify edge function secrets are configured (e.g., `YOUTUBE_API_KEY`)

### Import Issues

- Verify file format matches the file extension
- Check column names in CSV/Excel match accepted headers
- Validate date format is YYYY-MM-DD
- Ensure event types referenced in the file exist in the database

## License

MIT
