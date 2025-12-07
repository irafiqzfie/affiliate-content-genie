const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// Test R2 connection and upload
async function testR2Upload() {
  console.log('🔧 Testing R2 Connection...\n');
  
  // Check environment variables
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;
  
  console.log('Environment Variables:');
  console.log('✅ R2_ACCOUNT_ID:', accountId ? 'SET' : '❌ NOT SET');
  console.log('✅ R2_ACCESS_KEY_ID:', accessKeyId ? 'SET' : '❌ NOT SET');
  console.log('✅ R2_SECRET_ACCESS_KEY:', secretAccessKey ? 'SET' : '❌ NOT SET');
  console.log('✅ R2_BUCKET_NAME:', bucketName || '❌ NOT SET');
  console.log('✅ R2_PUBLIC_URL:', publicUrl || '❌ NOT SET');
  console.log('');
  
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
  }
  
  // Initialize R2 client
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  
  console.log('📤 Uploading test file to R2...');
  
  const testContent = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="#4CAF50"/>
    <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="14" font-family="Arial">TEST</text>
  </svg>`;
  
  const fileKey = `test/test-${Date.now()}.svg`;
  
  try {
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: fileKey,
      Body: Buffer.from(testContent),
      ContentType: 'image/svg+xml',
    });
    
    await r2Client.send(command);
    
    const testUrl = `${publicUrl}/${fileKey}`;
    
    console.log('✅ Upload successful!');
    console.log('📁 File Key:', fileKey);
    console.log('🌐 Public URL:', testUrl);
    console.log('');
    console.log('🧪 Test the URL in your browser:');
    console.log(testUrl);
    console.log('');
    console.log('✅ R2 is configured correctly!');
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Verify credentials are correct');
    console.error('2. Check bucket name matches exactly');
    console.error('3. Ensure API token has Object Read & Write permissions');
    console.error('4. Verify token is scoped to the correct bucket');
    process.exit(1);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

testR2Upload();
