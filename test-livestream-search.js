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

import { readFileSync, existsSync } from 'fs';

function resolveEnv() {
  const env = { ...process.env };
  if (existsSync('.env')) {
    const envContent = readFileSync('.env', 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        if (!env[key]) {
          env[key] = match[2].trim();
        }
      }
    });
  }
  return env;
}

const env = resolveEnv();

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required credentials: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment or .env file');
  process.exit(1);
}

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
