## Consent (ads & analytics)

AdSense requires a **Google-certified CMP** implementing IAB TCF v2.2 for
users in the EEA, UK and Switzerland. Google Consent Mode on its own is not
enough: without a certified CMP only "limited ads" are served there.

We use Google's own certified CMP ("Privacy & messaging" in AdSense), plus our
own banner for Google Analytics.

### How it fits together

| Piece | File | Responsibility |
|-------|------|----------------|
| Consent Mode defaults | `index.html` | Everything `denied` until a choice is known |
| Google CMP | loaded by the AdSense tag in `index.html` | Shows the GDPR message, exposes `window.__tcfapi` |
| TCF bridge | `src/layout/ad-consent.ts` | Maps the TCF decision to `ad_storage`, `ad_user_data`, `ad_personalization` |
| Analytics banner | `src/layout/CookieConsent.svelte`, `cookie-consent.ts` | Asks for `analytics_storage`, shown after the CMP decision |
| Footer links | `src/layout/Footer.svelte` | "Ad preferences" reopens the CMP, "Cookie settings" reopens the analytics banner |

TCF → Consent Mode mapping (all also require consent for Google, vendor 755):

- `ad_storage` ← purpose 1
- `ad_user_data` ← purposes 1 + 7
- `ad_personalization` ← purposes 3 + 4

If the CMP does not appear within 4 s (ad blocker, offline, non-EEA visitor
without a message), the analytics banner is shown anyway.

### One-time setup in AdSense (required)

The code only works once the GDPR message is published in AdSense:

1. AdSense → **Privacy & messaging** → **European regulations** → *Create message*.
2. Select the site `bmxkalender.be`, languages **Dutch, French, English**.
3. Link the privacy policy: `https://bmxkalender.be/privacy-policy`.
4. Choose the consent options (e.g. "Consent" + "Manage options"; a
   "Do not consent" button is recommended for GDPR) and **Publish**.
5. Leave "Use your AdSense code" (default): the message is loaded by the
   existing AdSense tag, no extra script needed.

To test, open the site in a private window from an EU IP: Google's message
should appear first, then the analytics banner.
