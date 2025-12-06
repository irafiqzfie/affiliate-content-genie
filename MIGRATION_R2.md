# Migrating from Vercel Blob to Cloudflare R2

## Table of Contents
1. [Overview](#overview)
2. [Architecture Changes](#architecture-changes)
3. [Step-by-Step Migration](#step-by-step-migration)
4. [Code Implementation](#code-implementation)
5. [Testing & Deployment](#testing--deployment)

---

## Overview

### Why Cloudflare R2?
- **Cost-effective**: No egress fees (vs Vercel Blob's bandwidth charges)
- **Scalability**: Better for high-traffic applications
- **Control**: More granular access control and caching options
- **Performance**: Global CDN with edge caching

### Migration Strategy
- **Zero-downtime**: Keep Vercel Blob URLs working
- **Gradual rollout**: New uploads use R2, old URLs remain functional
- **Backward compatible**: No changes to existing saved content

---

## Architecture Changes

### Before (Vercel Blob)
```
Client → Next.js API Route → Vercel Blob SDK → Blob Storage
                           ↓
                    Return Public URL
```

### After (Cloudflare R2)
```
Client → Next.js API (Generate Presigned URL) → Client Direct Upload to R2
                           ↓
                    Save Metadata to DB
                           ↓
                    Return Public R2 URL
```

### Storage Structure
```
R2 Bucket: affiliate-content-genie
├── user-content/
│   ├── {userId}/
│   │   ├── {uuid}-{timestamp}.jpg
│   │   ├── {uuid}-{timestamp}.png
│   │   └── ...
├── placeholders/
│   └── {uuid}.svg
└── generated/
    └── {contentId}/
        └── {uuid}.jpg
```

---

## Step-by-Step Migration

### Phase 1: Cloudflare R2 Setup

#### 1.1 Create R2 Bucket
1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2 Object Storage**
3. Click **Create bucket**
4. Settings:
   - **Bucket name**: `affiliate-content-genie`
   - **Region**: Auto (uses closest location)
5. Click **Create bucket**

#### 1.2 Configure Public Access
1. In bucket settings, go to **Settings** tab
2. Under **Public access**, click **Allow Access**
3. Add custom domain (optional but recommended):
   - Click **Connect Domain**
   - Enter: `cdn.inabiz.online` (or your preferred subdomain)
   - Follow DNS setup instructions

#### 1.3 Get API Credentials
1. Go to **R2** → **Manage R2 API Tokens**
2. Click **Create API Token**
3. Settings:
   - **Token name**: `affiliate-content-genie-production`
   - **Permissions**: Object Read & Write
   - **TTL**: Never expire (or set custom)
   - **Bucket scope**: Select your bucket
4. Click **Create API Token**
5. **SAVE THESE VALUES** (you won't see them again):
   - `Access Key ID`
   - `Secret Access Key`
   - `Account ID`

#### 1.4 CORS Configuration
1. In bucket settings, go to **Settings** → **CORS Policy**
2. Add this configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://www.inabiz.online",
      "https://inabiz.online",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

### Phase 2: Environment Configuration

#### 2.1 Add Environment Variables

**Local (.env.local):**
```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key_id
R2_SECRET_ACCESS_KEY=your_secret_access_key
R2_BUCKET_NAME=affiliate-content-genie
R2_PUBLIC_URL=https://cdn.inabiz.online  # or https://pub-xxxxx.r2.dev

# Keep existing Vercel Blob (for backward compatibility)
BLOB_READ_WRITE_TOKEN=your_existing_token
```

**Vercel Production:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all R2 variables above
3. Set for: **Production**, **Preview**, **Development**

### Phase 3: Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner uuid
```

Why AWS SDK? R2 is S3-compatible, so we use AWS SDK with R2 endpoints.

---

## Code Implementation

### 1. R2 Client Utility

Create `src/lib/r2.ts`:

\`\`\`typescript
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: \`https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com\`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'affiliate-content-genie';
const PUBLIC_URL = process.env.R2_PUBLIC_URL || \`https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev\`;

export interface UploadConfig {
  folder: 'user-content' | 'placeholders' | 'generated';
  userId?: string;
  fileName: string;
  contentType: string;
  expiresIn?: number; // seconds, default 3600 (1 hour)
}

/**
 * Generate presigned URL for client-side upload
 */
export async function generatePresignedUploadUrl(config: UploadConfig) {
  const { folder, userId, fileName, contentType, expiresIn = 3600 } = config;
  
  // Generate unique file key
  const timestamp = Date.now();
  const uuid = uuidv4();
  const extension = fileName.split('.').pop();
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  let fileKey: string;
  if (folder === 'user-content' && userId) {
    fileKey = \`\${folder}/\${userId}/\${uuid}-\${timestamp}.\${extension}\`;
  } else {
    fileKey = \`\${folder}/\${uuid}-\${timestamp}-\${sanitizedName}\`;
  }

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(r2Client, command, { expiresIn });

  return {
    uploadUrl: presignedUrl,
    fileKey,
    publicUrl: \`\${PUBLIC_URL}/\${fileKey}\`,
  };
}

/**
 * Delete file from R2
 */
export async function deleteFromR2(fileKey: string) {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  await r2Client.send(command);
}

/**
 * Check if file exists
 */
export async function fileExists(fileKey: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });
    await r2Client.send(command);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get public URL for a file key
 */
export function getPublicUrl(fileKey: string): string {
  return \`\${PUBLIC_URL}/\${fileKey}\`;
}

/**
 * Extract file key from R2 URL
 */
export function extractFileKey(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch {
    return null;
  }
}

/**
 * Check if URL is from R2
 */
export function isR2Url(url: string): boolean {
  return url.includes('.r2.dev') || url.includes('cdn.inabiz.online');
}

/**
 * Check if URL is from Vercel Blob (backward compatibility)
 */
export function isVercelBlobUrl(url: string): boolean {
  return url.includes('blob.vercel-storage.com') || url.includes('public.blob.vercel-storage.com');
}
\`\`\`

### 2. Upload API Route

Create `src/app/api/r2/upload-url/route.ts`:

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { generatePresignedUploadUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { fileName, contentType, folder = 'user-content' } = body;

    // Validate inputs
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'Missing fileName or contentType' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (optional, set max size)
    const maxSize = 10 * 1024 * 1024; // 10MB
    // Note: Size validation happens on client before upload

    // Generate presigned URL
    const result = await generatePresignedUploadUrl({
      folder,
      userId: session.user.id,
      fileName,
      contentType,
      expiresIn: 3600, // 1 hour
    });

    console.log('✅ Generated presigned URL:', {
      fileKey: result.fileKey,
      publicUrl: result.publicUrl,
    });

    return NextResponse.json({
      success: true,
      uploadUrl: result.uploadUrl,
      fileKey: result.fileKey,
      publicUrl: result.publicUrl,
    });

  } catch (error) {
    console.error('❌ Error generating presigned URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate upload URL',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
\`\`\`

### 3. Update Upload Image Route (Backward Compatible)

Update `src/app/api/upload-image/route.ts`:

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generatePresignedUploadUrl } from '@/lib/r2';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, useR2 = true } = body; // useR2 defaults to true for new uploads

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image data provided' },
        { status: 400 }
      );
    }

    // Check if it's a base64 data URL
    if (!imageData.startsWith('data:')) {
      return NextResponse.json(
        { error: 'Invalid image format. Must be a data URL.' },
        { status: 400 }
      );
    }

    // Extract content type and base64 data
    const matches = imageData.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid data URL format' },
        { status: 400 }
      );
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // NEW: Use R2 by default
    if (useR2) {
      console.log('📤 Uploading to Cloudflare R2...');
      
      // For server-side upload, we use AWS SDK directly
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const { v4: uuidv4 } = await import('uuid');
      
      const r2Client = new S3Client({
        region: 'auto',
        endpoint: \`https://\${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com\`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        },
      });

      const timestamp = Date.now();
      const uuid = uuidv4();
      const extension = contentType.split('/')[1];
      const fileKey = \`generated/\${uuid}-\${timestamp}.\${extension}\`;

      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME || 'affiliate-content-genie',
        Key: fileKey,
        Body: buffer,
        ContentType: contentType,
      });

      await r2Client.send(command);

      const publicUrl = \`\${process.env.R2_PUBLIC_URL}/\${fileKey}\`;

      console.log('✅ Uploaded to R2:', publicUrl);

      return NextResponse.json({
        success: true,
        url: publicUrl,
        fileKey,
        storage: 'r2',
      });
    }

    // FALLBACK: Vercel Blob (for backward compatibility)
    console.log('📤 Uploading to Vercel Blob (fallback)...');
    
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'Blob storage not configured' },
        { status: 500 }
      );
    }

    const fileName = \`threads-image-\${Date.now()}.\${contentType.split('/')[1]}\`;
    const blob = await put(fileName, buffer, {
      access: 'public',
      contentType,
    });

    console.log('✅ Uploaded to Vercel Blob:', blob.url);

    return NextResponse.json({
      success: true,
      url: blob.url,
      storage: 'vercel-blob',
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
\`\`\`

### 4. Delete API Route

Create `src/app/api/r2/delete/route.ts`:

\`\`\`typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { deleteFromR2, extractFileKey, isR2Url } from '@/lib/r2';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url, fileKey } = body;

    let keyToDelete = fileKey;

    // If URL provided, extract file key
    if (url && !fileKey) {
      if (!isR2Url(url)) {
        return NextResponse.json(
          { error: 'Not an R2 URL' },
          { status: 400 }
        );
      }
      keyToDelete = extractFileKey(url);
    }

    if (!keyToDelete) {
      return NextResponse.json(
        { error: 'No file key or URL provided' },
        { status: 400 }
      );
    }

    // Security: Ensure user can only delete their own files
    if (!keyToDelete.includes(session.user.id) && !keyToDelete.startsWith('generated/')) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this file' },
        { status: 403 }
      );
    }

    await deleteFromR2(keyToDelete);

    console.log('✅ Deleted from R2:', keyToDelete);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully',
    });

  } catch (error) {
    console.error('❌ Delete error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
\`\`\`

### 5. Client-Side Upload Helper

Create `src/lib/uploadToR2.ts`:

\`\`\`typescript
interface UploadResult {
  success: boolean;
  publicUrl?: string;
  fileKey?: string;
  error?: string;
}

/**
 * Upload image to R2 (client-side)
 * 1. Get presigned URL from API
 * 2. Upload directly to R2
 * 3. Return public URL
 */
export async function uploadImageToR2(file: File): Promise<UploadResult> {
  try {
    // Step 1: Get presigned upload URL
    const response = await fetch('/api/r2/upload-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        folder: 'user-content',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { uploadUrl, publicUrl, fileKey } = await response.json();

    // Step 2: Upload directly to R2 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload to R2');
    }

    console.log('✅ Uploaded to R2:', publicUrl);

    return {
      success: true,
      publicUrl,
      fileKey,
    };
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/**
 * Upload base64 image to R2 (for existing flows)
 */
export async function uploadBase64ToR2(dataUrl: string): Promise<UploadResult> {
  try {
    // Use existing upload-image endpoint with R2 enabled
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData: dataUrl,
        useR2: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload');
    }

    const { url, fileKey } = await response.json();

    return {
      success: true,
      publicUrl: url,
      fileKey,
    };
  } catch (error) {
    console.error('❌ Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
\`\`\`

### 6. Update Visualize Image Route

Update `src/app/api/visualize/image/route.ts` to use R2:

\`\`\`typescript
// At the top, add R2 imports
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

// Initialize R2 client (add after existing imports)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: \`https://\${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com\`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

// Replace placeholder upload section with:
async function uploadPlaceholderToR2(svgContent: string): Promise<string> {
  const timestamp = Date.now();
  const uuid = uuidv4();
  const fileKey = \`placeholders/\${uuid}-\${timestamp}.svg\`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME || 'affiliate-content-genie',
    Key: fileKey,
    Body: Buffer.from(svgContent),
    ContentType: 'image/svg+xml',
  });

  await r2Client.send(command);
  
  return \`\${process.env.R2_PUBLIC_URL}/\${fileKey}\`;
}

// Update the placeholder creation code to use R2:
const placeholderUrl = await uploadPlaceholderToR2(placeholderSvg);
\`\`\`

---

## Testing & Deployment

### Pre-Deployment Checklist

- [ ] R2 bucket created and configured
- [ ] API credentials saved in environment variables
- [ ] CORS policy configured on R2 bucket
- [ ] All code changes committed
- [ ] Dependencies installed (\`@aws-sdk/client-s3\`, etc.)
- [ ] Environment variables added to Vercel

### Testing Locally

1. **Test Upload**:
\`\`\`bash
npm run dev
\`\`\`
- Generate content
- Upload an image
- Check console for R2 upload logs
- Verify image displays correctly

2. **Test Backward Compatibility**:
- Load existing saved content with Vercel Blob URLs
- Ensure images still display

3. **Test New Upload Flow**:
- Generate new content
- Save to Posts tab
- Verify R2 URL is stored
- Post to Threads

### Deployment Steps

1. **Commit Changes**:
\`\`\`bash
git add .
git commit -m "feat: Migrate image storage from Vercel Blob to Cloudflare R2"
git push origin main
\`\`\`

2. **Deploy to Vercel**:
- Vercel will auto-deploy from GitHub
- Monitor build logs for errors

3. **Verify Production**:
- Test image upload on production
- Check R2 dashboard for new files
- Verify existing content still loads

### Monitoring

**Check R2 Dashboard**:
- Navigate to R2 → Your Bucket
- Monitor usage and storage
- Check for any errors

**Database Check**:
- Verify new records contain R2 URLs
- Old records still have Vercel Blob URLs (working fine)

---

## Cost Comparison

### Vercel Blob
- Storage: $0.15/GB/month
- **Bandwidth: $0.30/GB** (expensive!)
- Requests: Free

### Cloudflare R2
- Storage: $0.015/GB/month (10x cheaper)
- **Bandwidth: $0.00** (free egress!)
- Class A operations: $4.50/million (PUT, LIST)
- Class B operations: $0.36/million (GET, HEAD)

**Estimated Savings**: 90%+ for high-traffic apps

---

## Rollback Plan

If issues occur:

1. Set \`useR2 = false\` in upload-image route
2. Redeploy
3. All new uploads revert to Vercel Blob
4. Investigate and fix R2 issues
5. Re-enable when ready

---

## Next Steps

1. ✅ Complete Phase 1-3 setup
2. ✅ Deploy code changes
3. ✅ Test thoroughly
4. Monitor for 24-48 hours
5. Consider removing Vercel Blob after 30 days (once all users migrated)

---

## Support & Resources

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/)
- [S3-compatible APIs](https://developers.cloudflare.com/r2/api/s3/api/)
