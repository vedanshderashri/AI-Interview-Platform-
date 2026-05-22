
const urls = [
  'http://localhost:3000/api/test',
  'http://localhost:3000/api/auth/login',
  'http://localhost:3000/api/auth/signup',
  'http://localhost:3000/api/analytics/sync',
  'http://localhost:3000/api/jobs/alerts',
  'http://localhost:3000/api/status/cache'
];

async function test() {
  for (const url of urls) {
    try {
      console.log(`Testing ${url}...`);
      const res = await fetch(url, { method: url.includes('auth') ? 'POST' : 'GET' });
      const text = await res.text();
      console.log(`Status: ${res.status}`);
      console.log(`Content-Type: ${res.headers.get('content-type')}`);
      if (text.trim().startsWith('<!DOCTYPE')) {
        console.log(`ERROR: Received HTML instead of JSON!`);
        console.log(text.substring(0, 100) + '...');
      } else {
        try {
          JSON.parse(text);
          console.log(`OK: Received valid JSON`);
        } catch (e) {
          console.log(`ERROR: Received invalid JSON: ${text.substring(0, 100)}...`);
        }
      }
      console.log('---');
    } catch (e) {
      console.log(`Fetch error for ${url}: ${e.message}`);
    }
  }
}

test();
