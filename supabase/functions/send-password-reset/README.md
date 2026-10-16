# Send Password Reset Edge Function

## Overview

This Edge Function generates a Supabase recovery token and emails the user a password reset link via Resend.

## Security Features

### Fixed reset-link origin
The reset link always points at the origin configured in the `SITE_URL` secret (default `https://bmxkalender.be`). The request body and the `Origin` header are attacker-controlled, so they are never used to build the link. This prevents password-reset poisoning (sending a valid token to an attacker's domain).

### HTML Escaping
The reset URL is HTML-escaped before it is inserted into the email template.

### URL Encoding
Recovery tokens are URL-encoded in the reset link.

### Rate limiting
Each client IP may request at most 5 resets per hour. This is best effort: counts are kept in memory per function instance (not shared across instances), and the IP is taken from the first `X-Forwarded-For` entry, which a client can set, so the limit can be bypassed by spoofing that header.

### User enumeration protection
The function returns success for unknown email addresses.

## Environment Variables

### Required
- `RESEND_API_KEY` - API key for the Resend email service
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

### Optional
- `SITE_URL` - Frontend origin used in reset links (e.g. `https://bmxkalender.be`). Only its origin is used; invalid or non-http(s) values fall back to `https://bmxkalender.be`.

```bash
supabase secrets set SITE_URL="https://bmxkalender.be"
```

## Request Format

```json
{
  "email": "user@example.com"
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

Status codes: `400` missing email, `429` rate limited, `503` email service not configured, `500` unexpected error.

## Testing

To test the function locally:

```bash
curl -X POST http://localhost:54321/functions/v1/send-password-reset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"email":"test@example.com"}'
```
