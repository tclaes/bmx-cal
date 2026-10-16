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