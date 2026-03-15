#!/usr/bin/env node

/**
 * Manual test script for the search-uec-livestream edge function
 *
 * Usage:
 *   node test-livestream-search.js [event_id]
 *
 * If no event_id is provided, it will search for today's UEC events.
 * To test a specific event, pass its UUID as an argument.
 */

const SUPABASE_URL = 'https://wateawaecktywtlfhomn.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdGVhd2FlY2t0eXd0bGZob21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzI1NDAyNiwiZXhwIjoyMDg4ODMwMDI2fQ.NeLhXnz3w1hav5mysLNmHzYA2rVE_qI9_Ut7s-_PUZM';

const eventId = process.argv[2];
const body = eventId ? { event_id: eventId } : {};

console.log('Testing search-uec-livestream edge function...');
console.log('Event ID:', eventId || 'None (searching for today\'s events)');
console.log('');

fetch(`${SUPABASE_URL}/functions/v1/search-uec-livestream`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
})
  .then(response => response.json())
  .then(data => {
    console.log('Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (data.results && data.results.length > 0) {
      console.log('Summary:');
      console.log(`- Total events processed: ${data.results.length}`);
      console.log(`- Events updated: ${data.updated}`);
      console.log('');

      data.results.forEach((result, idx) => {
        console.log(`Event ${idx + 1}: ${result.title}`);
        console.log(`  Status: ${result.status}`);
        if (result.livestreamUrl) {
          console.log(`  Livestream URL: ${result.livestreamUrl}`);
        }
        console.log('');
      });
    }

    if (data.error) {
      console.error('Error:', data.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Request failed:', error.message);
    process.exit(1);
  });
