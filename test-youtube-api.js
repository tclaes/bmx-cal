#!/usr/bin/env node

/**
 * Test script to verify YouTube API integration
 *
 * This simulates what the search-uec-livestream edge function does
 */

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || 'YOUR_YOUTUBE_API_KEY';

async function searchYouTubeLive(searchQuery) {
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('q', searchQuery);
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('eventType', 'live');
  searchUrl.searchParams.set('maxResults', '5');
  searchUrl.searchParams.set('key', YOUTUBE_API_KEY);

  console.log(`Searching YouTube for: "${searchQuery}"`);
  const redactedUrl = new URL(searchUrl.toString());
  redactedUrl.searchParams.set('key', '***REDACTED***');
  console.log(`URL: ${redactedUrl.toString()}\n`);

  const response = await fetch(searchUrl.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error('YouTube API Error:', response.status, errorText);
    return null;
  }

  const data = await response.json();
  return data;
}

async function testSearch() {
  const testQueries = [
    'UEC BMX European Cup round 1 2026 live',
    'UEC BMX European Cup 2026 live',
    'BMX Racing live stream',
  ];

  for (const query of testQueries) {
    const result = await searchYouTubeLive(query);

    if (result) {
      console.log(`Found ${result.items?.length || 0} results`);

      if (result.items && result.items.length > 0) {
        console.log('\nTop results:');
        result.items.forEach((item, idx) => {
          const videoId = item.id.videoId;
          const title = item.snippet.title;
          const channel = item.snippet.channelTitle;
          const url = `https://www.youtube.com/watch?v=${videoId}`;

          console.log(`\n${idx + 1}. ${title}`);
          console.log(`   Channel: ${channel}`);
          console.log(`   URL: ${url}`);
        });
      } else {
        console.log('No live streams found for this query.');
      }
    }

    console.log('\n' + '='.repeat(80) + '\n');

    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

console.log('Testing YouTube API Integration\n');
console.log('='.repeat(80) + '\n');

testSearch().catch(error => {
  console.error('Test failed:', error.message);
  process.exit(1);
});
