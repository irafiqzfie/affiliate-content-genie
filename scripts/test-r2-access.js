// Test if R2 URLs are publicly accessible
async function testR2Access() {
  const testUrl = 'https://pub-f7428c8dffee40d29bba42a6146178f8.r2.dev/test/test-1765068168390.svg';
  
  console.log('🧪 Testing R2 public access...');
  console.log('URL:', testUrl);
  console.log('');
  
  try {
    // Test with HEAD request (what Threads API validation uses)
    console.log('📡 HEAD request...');
    const headResponse = await fetch(testUrl, { method: 'HEAD' });
    console.log('Status:', headResponse.status, headResponse.statusText);
    console.log('Headers:', Object.fromEntries(headResponse.headers.entries()));
    console.log('');
    
    // Test with GET request
    console.log('📡 GET request...');
    const getResponse = await fetch(testUrl);
    console.log('Status:', getResponse.status, getResponse.statusText);
    console.log('Content-Type:', getResponse.headers.get('content-type'));
    console.log('');
    
    if (headResponse.ok && getResponse.ok) {
      console.log('✅ R2 public access is working correctly!');
      console.log('✅ Images should load in Threads');
    } else {
      console.log('❌ R2 public access is NOT working');
      console.log('');
      console.log('Possible issues:');
      console.log('1. R2.dev subdomain not fully activated yet (wait 5-10 minutes)');
      console.log('2. CORS headers need configuration');
      console.log('3. Public access not enabled on bucket');
    }
  } catch (error) {
    console.error('❌ Error accessing R2:', error.message);
  }
}

testR2Access();
