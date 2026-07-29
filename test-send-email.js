#!/usr/bin/env node

/**
 * Test script to send a test email via the send-contact-email edge function
 */

import { readFileSync } from 'fs';

const envContent = readFileSync('.env', 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

async function sendTestEmail() {
  console.log('Sending test email...\n');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/send-contact-email`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@tcla.be',
      clubName: 'Test BMX Club',
      message: 'This is a test email from the BMX Calendar contact form.\n\nTesting the email integration with Resend.',
    }),
  });

  console.log('Status:', response.status);

  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));

  if (response.ok) {
    console.log('\n✅ Test email sent successfully!');
    console.log('Check your inbox at: tom.claes82@gmail.com');
    console.log('From: BMX Calendar <bmxcalendar@tcla.be>');
    console.log('Reply-to: test@tcla.be');
  } else {
    console.log('\n❌ Failed to send test email');

    if (data.error === 'Email service not configured') {
      console.log('\n⚠️  RESEND_API_KEY is not configured in Supabase Edge Functions');
      console.log('Please add the Resend API key as a secret:');
      console.log('1. Go to Supabase Dashboard → Edge Functions → Secrets');
      console.log('2. Add: RESEND_API_KEY = <your-resend-api-key>');
    }
  }
}

sendTestEmail().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
