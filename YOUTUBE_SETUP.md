# YouTube API Setup for Livestream Search

The `search-uec-livestream` edge function requires a YouTube API key to search for live broadcasts.

## Obtaining a YouTube API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the **YouTube Data API v3** from the API library
4. Create an API key under **Credentials**
5. Restrict the key to the YouTube Data API v3 for security

## Setting up the Secret in Supabase

**IMPORTANT**: The YouTube API key must be added to Supabase Edge Functions as a secret.

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard for your project
2. Navigate to **Edge Functions** → **Manage secrets** (or **Settings** → **Edge Functions** → **Secrets**)
3. Click **Add new secret**
4. Add the secret:
   - **Name**: `YOUTUBE_API_KEY`
   - **Value**: your-youtube-api-key-here
5. Click **Save**

### Option 2: Via Supabase CLI (Alternative)

```bash
supabase secrets set YOUTUBE_API_KEY=your-youtube-api-key-here
```

### Verification

After adding the secret, verify it's working:

```bash
# Test the edge function
node test-livestream-search.js <event-id>
```

The function should no longer return "YOUTUBE_API_KEY secret is not configured" errors.

## How it works

The edge function:
1. Runs daily at 08:00 UTC via a cron job
2. Searches for UEC events happening today
3. Uses YouTube Data API v3 to find live broadcasts
4. Updates the `events` table with the livestream URL if found

## Manual Testing

You can test the function manually using:

```bash
# Test for today's events
node test-livestream-search.js

# Test for a specific event
node test-livestream-search.js <event-id>

# Test YouTube API directly
node test-youtube-api.js
```

## Expected Behavior

**When the secret is configured:**
- Function searches YouTube for live streams matching UEC event titles
- If a matching livestream is found, the `events.livestream_url` is updated
- Returns status: "updated", "no live stream found", or "YouTube API error"

**When the secret is NOT configured:**
- Function returns: `{"error": "YOUTUBE_API_KEY secret is not configured"}`

## Cron Job Schedule

The cron job `search-uec-livestream-daily` is scheduled to run:
- **Time**: 08:00 UTC (every day)
- **Function**: Calls the `search-uec-livestream` edge function
- **Target**: Events happening on the current date
- **Filters**: Events with titles containing "UEC", "European Cup", or "European Championships"

You can monitor the job execution in the Supabase logs or by checking the `sync_logs` table.
