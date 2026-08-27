# Send Password Reset Function

This Edge Function handles password reset email requests with security measures to prevent token exfiltration attacks.

## Security Features

### Origin Validation
The function validates that password reset links are only sent to trusted origins to prevent password-reset poisoning attacks where an attacker could exfiltrate recovery tokens to their own domain.

### HTML Escaping
All URLs are HTML-escaped before being inserted into email templates to prevent email injection attacks.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Yes | API key for Resend email service |
| `SUPABASE_URL` | Yes | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key |
| `ALLOWED_ORIGINS` | No | Comma-separated list of allowed origins for password reset links. If not set, defaults to `SUPABASE_URL`. |

### Example Configuration

```bash
# Single origin (production only)
ALLOWED_ORIGINS=https://bmxcalendar.be

# Multiple origins (production + staging)
ALLOWED_ORIGINS=https://bmxcalendar.be,https://staging.bmxcalendar.be

# Development (include localhost)
ALLOWED_ORIGINS=https://bmxcalendar.be,http://localhost:5173
```

## Usage

The function expects a POST request with the following JSON body:

```json
{
  "email": "user@example.com",
  "appUrl": "https://bmxcalendar.be"
}
```

- `email` (required): The email address to send the password reset link to
- `appUrl` (optional): The origin to use for the reset link. If not provided, falls back to the `Origin` header. Must be in the `ALLOWED_ORIGINS` list.

## Response Codes

- `200`: Success - email sent (or user not found, to prevent email enumeration)
- `400`: Bad request - missing email
- `403`: Forbidden - invalid origin
- `500`: Internal server error
- `503`: Service unavailable - email service not configured

## Security Considerations

1. **Origin Allowlist**: Always configure `ALLOWED_ORIGINS` in production to include only your trusted domains.
2. **Token Expiration**: Recovery tokens expire after 1 hour (configured in Supabase Auth settings).
3. **Email Enumeration Protection**: The function returns success even if the user doesn't exist to prevent attackers from discovering valid email addresses.
4. **Logging**: Invalid origin attempts are logged with a warning for security monitoring.
