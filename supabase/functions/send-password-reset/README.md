# Send Password Reset Edge Function

## Overview

This Edge Function generates and sends password reset emails with secure recovery tokens. It implements strict origin validation to prevent password-reset poisoning attacks.

## Security Features

### Origin Validation
The function validates all requested origins against an allowlist to prevent token exfiltration attacks. Only origins explicitly configured in the `ALLOWED_ORIGINS` environment variable (or the Supabase URL as a fallback) are permitted.

### HTML Escaping
All URLs are HTML-escaped before being inserted into email templates to prevent email injection attacks.

### URL Encoding
Recovery tokens are properly URL-encoded to prevent parsing issues and injection attacks.

## Environment Variables

### Required
- `RESEND_API_KEY` - API key for the Resend email service
- `SUPABASE_URL` - Your Supabase project URL (automatically included in allowlist)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

### Optional
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins for password reset links
  - Example: `https://bmxcalendar.com,https://www.bmxcalendar.com,https://staging.bmxcalendar.com`
  - If not set, only the `SUPABASE_URL` will be allowed
  - The `SUPABASE_URL` is always included in the allowlist automatically

## Request Format

```json
{
  "email": "user@example.com",
  "appUrl": "https://bmxcalendar.com"  // Optional, must be in allowlist
}
```

## Response Format

### Success
```json
{
  "success": true
}
```

### Error
```json
{
  "error": "Error message"
}
```

## Security Considerations

1. **Origin Validation**: The function validates the `appUrl` parameter and `Origin` header against the allowlist. If neither is valid, it falls back to `SUPABASE_URL`.

2. **Token Protection**: Recovery tokens are only sent to validated origins, preventing token exfiltration to attacker-controlled domains.

3. **User Enumeration Protection**: The function returns success even for non-existent users to prevent email enumeration attacks.

4. **HTML Injection Prevention**: All URLs are HTML-escaped before insertion into email templates.

## Deployment

When deploying this function, ensure the `ALLOWED_ORIGINS` environment variable is set to include all legitimate frontend domains:

```bash
# Example for Supabase CLI
supabase secrets set ALLOWED_ORIGINS="https://bmxcalendar.com,https://www.bmxcalendar.com"
```

## Testing

To test the function locally:

```bash
curl -X POST http://localhost:54321/functions/v1/send-password-reset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com","appUrl":"https://bmxcalendar.com"}'
```
