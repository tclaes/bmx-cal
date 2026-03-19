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

async function testCronJob(name, endpoint) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing: ${name}`);
  console.log(`${'='.repeat(60)}`);

  try {
    const url = `${SUPABASE_URL}/functions/v1/${endpoint}`;
    console.log(`Calling: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log(`✓ ${name} executed successfully`);
    } else {
      console.log(`✗ ${name} failed with status ${response.status}`);
    }

    return { success: response.ok, data };
  } catch (error) {
    console.error(`✗ Error executing ${name}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('Testing Cron Job Edge Functions');
  console.log('='.repeat(60));

  const results = await Promise.all([
    testCronJob('JSTiming Sync', 'sync-jstiming'),
    testCronJob('UEC Livestream Search', 'search-uec-livestream'),
  ]);

  console.log('\n' + '='.repeat(60));
  console.log('Summary:');
  console.log('='.repeat(60));

  const successful = results.filter(r => r.success).length;
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${results.length - successful}`);

  if (successful === results.length) {
    console.log('\n✓ All cron jobs are working correctly!');
  } else {
    console.log('\n✗ Some cron jobs failed. Check the logs above for details.');
  }
}

main();
