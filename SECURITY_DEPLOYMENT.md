# Security Fix Deployment Guide

## Password Reset Security

The `send-password-reset` Edge Function builds reset links only from the `SITE_URL` secret. It never uses the request body or the `Origin` header, so an attacker cannot make a reset email point at their own domain (password-reset poisoning). See `supabase/functions/send-password-reset/README.md` for details.

### Key properties
1. **Fixed origin**: reset links use `SITE_URL` (default `https://bmxkalender.be`)
2. **HTML Escaping**: the reset URL is HTML-escaped before insertion into the email template
3. **URL Encoding**: recovery tokens are URL-encoded
4. **Rate limiting**: at most 5 reset requests per IP per hour
5. **No user enumeration**: unknown emails still get a success response

## Deployment Steps

### 1. Set the SITE_URL secret

```bash
supabase secrets set SITE_URL="https://bmxkalender.be"
```

`ALLOWED_ORIGINS` is not used; if it was set for an earlier version of this guide, it can be removed:

```bash
supabase secrets unset ALLOWED_ORIGINS
```

### 2. Deploy the function

```bash
supabase functions deploy send-password-reset
```

### 3. Verify

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-password-reset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Origin: https://attacker-controlled.com" \
  -d '{"email": "test@example.com"}'
```

Expected: success response, and the email's link points at `SITE_URL`, not the `Origin` header.

## Monitoring

```bash
supabase functions logs send-password-reset
```

## Testing Checklist

- [ ] `SITE_URL` secret is set
- [ ] Function deploys without errors
- [ ] Reset emails link to `SITE_URL` regardless of the request's `Origin`
- [ ] Frontend password reset flow works end-to-end
