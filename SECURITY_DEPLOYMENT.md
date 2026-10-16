# Security Fix Deployment Guide

## Password Reset Security Enhancement

This deployment guide covers the security fix for password-reset poisoning vulnerability (CVE-TBD).

## What Changed

The `send-password-reset` Edge Function now validates all requested origins against an allowlist to prevent attackers from exfiltrating password reset tokens to attacker-controlled domains.

### Key Changes:
1. **Origin Validation**: All `appUrl` parameters and `Origin` headers are validated against an allowlist
2. **HTML Escaping**: URLs are HTML-escaped before insertion into email templates
3. **URL Encoding**: Recovery tokens are properly URL-encoded
4. **Secure Fallback**: Invalid origins fall back to the Supabase URL

## Deployment Steps

### 1. Set the ALLOWED_ORIGINS Environment Variable

The function requires the `ALLOWED_ORIGINS` environment variable to be set with a comma-separated list of legitimate frontend domains.

#### Using Supabase Dashboard:
1. Go to your Supabase project dashboard
2. Navigate to **Settings** → **Edge Functions**
3. Add a new secret:
   - Name: `ALLOWED_ORIGINS`
   - Value: `https://bmxkalender.be,https://www.bmxkalender.be` (adjust to your domains)

#### Using Supabase CLI:
```bash
supabase secrets set ALLOWED_ORIGINS="https://bmxkalender.be,https://www.bmxkalender.be"
```

#### For Local Development:
Add to your `.env` file:
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:4173
```

### 2. Deploy the Updated Function

```bash
# Deploy the function
supabase functions deploy send-password-reset

# Verify deployment
supabase functions list
```

### 3. Verify the Fix

Test that the function properly validates origins:

#### Test 1: Valid Origin (Should Succeed)
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-password-reset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "appUrl": "https://bmxkalender.be"
  }'
```

Expected: Success response, email sent with legitimate origin

#### Test 2: Invalid Origin (Should Fall Back to Supabase URL)
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-password-reset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com",
    "appUrl": "https://attacker-controlled.com"
  }'
```

Expected: Success response, but email sent with Supabase URL (not attacker's URL)

#### Test 3: No Origin Provided (Should Use Supabase URL)
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-password-reset \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "email": "test@example.com"
  }'
```

Expected: Success response, email sent with Supabase URL

### 4. Update Frontend (If Needed)

The frontend code in `src/features/auth/ForgotPasswordPage.svelte` already sends `window.location.origin` as `appUrl`, which is correct. No changes needed unless you want to remove the `appUrl` parameter entirely and rely on the `Origin` header.

## Security Considerations

### What This Fix Prevents:
1. **Password-Reset Poisoning**: Attackers can no longer cause reset emails to contain links to attacker-controlled domains
2. **Token Exfiltration**: Recovery tokens are only sent to validated, trusted origins
3. **Email Injection**: HTML special characters are escaped to prevent email template injection
4. **Open Redirects**: URL validation prevents redirect attacks

### What This Fix Does NOT Prevent:
- **Email Enumeration**: The function still returns success for non-existent users (by design, to prevent enumeration)
- **Rate Limiting**: Consider implementing rate limiting at the API gateway level
- **Brute Force**: Consider implementing CAPTCHA or rate limiting for password reset requests

## Monitoring

After deployment, monitor the following:

1. **Function Logs**: Check for any validation failures or errors
   ```bash
   supabase functions logs send-password-reset
   ```

2. **Email Delivery**: Verify that legitimate password reset emails are being delivered correctly

3. **User Reports**: Monitor for any user complaints about not receiving reset emails

## Rollback Plan

If issues arise, you can quickly rollback:

1. Revert the function code to the previous version
2. Redeploy:
   ```bash
   git checkout <previous-commit>
   supabase functions deploy send-password-reset
   ```

## Additional Recommendations

1. **Rate Limiting**: Implement rate limiting on the Edge Function to prevent abuse
2. **CAPTCHA**: Consider adding CAPTCHA to the forgot-password form
3. **Monitoring**: Set up alerts for unusual patterns in password reset requests
4. **Audit Logging**: Log all password reset attempts for security auditing

## Questions or Issues?

If you encounter any issues during deployment, check:
1. Function logs: `supabase functions logs send-password-reset`
2. Environment variables: Verify `ALLOWED_ORIGINS` is set correctly
3. DNS/Domain: Ensure your domains are accessible and properly configured

## Testing Checklist

- [ ] `ALLOWED_ORIGINS` environment variable is set
- [ ] Function deploys without errors
- [ ] Password reset emails are received with correct origin
- [ ] Invalid origins are rejected and fall back to Supabase URL
- [ ] HTML in emails is properly escaped
- [ ] Frontend password reset flow works end-to-end
- [ ] Monitoring and logging are in place
