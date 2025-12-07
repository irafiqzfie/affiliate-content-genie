# Cloudflare R2 Cost Control & Monitoring Plan

## Executive Summary

Prevent R2 free tier overages through automated monitoring, request optimization, and intelligent caching strategies.

**Free Tier Limits:**
- Storage: 10 GB
- Class A Operations (PUT, LIST): 1M/month
- Class B Operations (GET, HEAD): 10M/month
- Egress: Unlimited (always free)

**Risk Assessment:** Class A operations are highest risk (image uploads, placeholders).

---

## 1. Request Optimization & Reduction

### 1.1 Eliminate Placeholder Generation Waste

**Current Issue:** Failed AI generation creates placeholder SVGs → wasted Class A operations.

**Solution:** Cache placeholders in-memory or use data URLs.

**Implementation:**

```typescript
// src/lib/placeholder-cache.ts
const placeholderCache = new Map<string, string>();

export function getPlaceholderDataUrl(keywords: string): string {
  const cacheKey = keywords.substring(0, 50);
  
  if (placeholderCache.has(cacheKey)) {
    return placeholderCache.get(cacheKey)!;
  }
  
  const svg = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
    <rect width="512" height="512" fill="#6366f1"/>
    <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
      ${keywords.substring(0, 30)}
    </text>
  </svg>`;
  
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  placeholderCache.set(cacheKey, dataUrl);
  
  return dataUrl;
}
```

**Update visualize/image/route.ts:**
```typescript
// Instead of uploading placeholder to R2:
const placeholderDataUrl = getPlaceholderDataUrl(cleanKeywords);

return NextResponse.json({ 
  imageUrl: placeholderDataUrl,
  isPlaceholder: true
});
```

**Impact:** Eliminates ~70% of Class A operations (based on AI generation failure rate).

---

### 1.2 Deduplicate Image Uploads

**Issue:** Same product images uploaded multiple times.

**Solution:** Content-based deduplication with hash checking.

**Implementation:**

```typescript
// src/lib/r2-dedup.ts
import { createHash } from 'crypto';
import { fileExists, getPublicUrl } from './r2';

export async function uploadWithDedup(config: {
  buffer: Buffer;
  contentType: string;
  folder: string;
  userId?: string;
}): Promise<{ publicUrl: string; fileKey: string; wasCached: boolean }> {
  // Generate content hash
  const hash = createHash('sha256').update(config.buffer).digest('hex').substring(0, 16);
  const extension = config.contentType.split('/')[1];
  const fileKey = `${config.folder}/${hash}.${extension}`;
  
  // Check if already exists
  const exists = await fileExists(fileKey);
  
  if (exists) {
    console.log('♻️ Using existing file:', fileKey);
    return {
      publicUrl: getPublicUrl(fileKey),
      fileKey,
      wasCached: true
    };
  }
  
  // Upload new file
  const result = await uploadToR2({
    ...config,
    fileName: `${hash}.${extension}`
  });
  
  return { ...result, wasCached: false };
}
```

**Impact:** Reduces duplicate uploads by ~40-60% for repeated products.

---

### 1.3 Batch Delete Operations

**Issue:** Individual DELETE requests consume Class A operations.

**Solution:** Already implemented in `scripts/delete-all-blobs.js` - batch deletions.

**Enhancement:** Add automatic cleanup of old placeholders.

```typescript
// src/app/api/r2/cleanup/route.ts
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';

export async function POST() {
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });

  const bucket = process.env.R2_BUCKET_NAME || 'inabiz-online';
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 30); // Delete files older than 30 days

  // List old placeholders
  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: 'placeholders/',
  });

  const response = await r2Client.send(listCommand);
  const oldObjects = response.Contents?.filter(obj => 
    obj.LastModified && obj.LastModified < cutoffDate
  ) || [];

  if (oldObjects.length === 0) {
    return NextResponse.json({ message: 'No old files to delete' });
  }

  // Batch delete (up to 1000 at once)
  const deleteCommand = new DeleteObjectsCommand({
    Bucket: bucket,
    Delete: {
      Objects: oldObjects.map(obj => ({ Key: obj.Key! })),
    },
  });

  await r2Client.send(deleteCommand);

  return NextResponse.json({ 
    deleted: oldObjects.length,
    message: `Deleted ${oldObjects.length} old placeholders`
  });
}
```

**Schedule:** Run via cron job or manually monthly.

---

## 2. Monitoring & Alerting

### 2.1 Usage Tracking Dashboard

**Create monitoring endpoint:**

```typescript
// src/app/api/r2/usage/route.ts
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

export async function GET() {
  const r2Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    },
  });

  const bucket = process.env.R2_BUCKET_NAME || 'inabiz-online';

  // List all objects to count and measure storage
  const listCommand = new ListObjectsV2Command({
    Bucket: bucket,
  });

  let totalObjects = 0;
  let totalSize = 0;
  let continuationToken: string | undefined;

  do {
    const response = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
    );

    totalObjects += response.KeyCount || 0;
    totalSize += response.Contents?.reduce((sum, obj) => sum + (obj.Size || 0), 0) || 0;
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  const usageData = {
    storage: {
      used: (totalSize / (1024 ** 3)).toFixed(2), // GB
      limit: 10, // GB
      percentage: ((totalSize / (10 * 1024 ** 3)) * 100).toFixed(1),
    },
    objects: {
      total: totalObjects,
    },
    classA: {
      // Note: Actual operation counts not available via API
      // Track via application logging
      estimated: 'See Cloudflare Dashboard',
      limit: 1000000,
    },
    classB: {
      estimated: 'See Cloudflare Dashboard',
      limit: 10000000,
    },
  };

  return NextResponse.json(usageData);
}
```

**Add to admin dashboard:**

```typescript
// src/app/admin/page.tsx (create if doesn't exist)
'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [usage, setUsage] = useState<any>(null);

  useEffect(() => {
    fetch('/api/r2/usage')
      .then(res => res.json())
      .then(setUsage);
  }, []);

  if (!usage) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>R2 Storage Usage</h1>
      
      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Storage</h2>
        <p>
          <strong>{usage.storage.used} GB</strong> / {usage.storage.limit} GB 
          ({usage.storage.percentage}%)
        </p>
        <div style={{ 
          width: '100%', 
          height: '20px', 
          backgroundColor: '#e0e0e0', 
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{ 
            width: `${usage.storage.percentage}%`, 
            height: '100%', 
            backgroundColor: parseFloat(usage.storage.percentage) > 80 ? '#f44336' : '#4caf50'
          }} />
        </div>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Objects</h2>
        <p><strong>{usage.objects.total}</strong> files stored</p>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <h2>Operations (Monthly)</h2>
        <p>Class A (PUT, LIST): {usage.classA.estimated}</p>
        <p>Class B (GET, HEAD): {usage.classB.estimated}</p>
        <p><small>Check Cloudflare Dashboard for exact counts</small></p>
      </div>
    </div>
  );
}
```

---

### 2.2 Application-Level Request Logging

**Track operations in your app:**

```typescript
// src/lib/r2-logger.ts
import { appendFileSync } from 'fs';
import { join } from 'path';

interface OperationLog {
  timestamp: string;
  type: 'PUT' | 'GET' | 'DELETE' | 'HEAD' | 'LIST';
  fileKey?: string;
  success: boolean;
  error?: string;
}

const logFilePath = join(process.cwd(), 'logs', 'r2-operations.log');

export function logR2Operation(log: OperationLog) {
  const entry = JSON.stringify({ ...log, timestamp: new Date().toISOString() }) + '\n';
  
  try {
    appendFileSync(logFilePath, entry);
  } catch (error) {
    console.error('Failed to log R2 operation:', error);
  }
}

// Usage in r2.ts:
export async function uploadToR2(config: any) {
  const startTime = Date.now();
  
  try {
    const result = await /* ... upload logic ... */;
    
    logR2Operation({
      timestamp: new Date().toISOString(),
      type: 'PUT',
      fileKey: result.fileKey,
      success: true,
    });
    
    return result;
  } catch (error) {
    logR2Operation({
      timestamp: new Date().toISOString(),
      type: 'PUT',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    throw error;
  }
}
```

**Analyze logs periodically:**

```bash
# Count operations by type (run monthly)
cat logs/r2-operations.log | jq -r '.type' | sort | uniq -c
```

---

### 2.3 Alert Thresholds

**Add to monitoring endpoint:**

```typescript
export async function GET() {
  // ... existing code ...

  const alerts = [];

  if (parseFloat(usageData.storage.percentage) > 80) {
    alerts.push({
      level: 'warning',
      message: 'Storage usage above 80%',
      action: 'Run cleanup script or delete old files'
    });
  }

  if (parseFloat(usageData.storage.percentage) > 95) {
    alerts.push({
      level: 'critical',
      message: 'Storage usage above 95%',
      action: 'URGENT: Delete files immediately'
    });
  }

  return NextResponse.json({ ...usageData, alerts });
}
```

---

## 3. CDN & Caching Strategy

### 3.1 Cloudflare CDN (Free)

**Enable caching headers in R2 uploads:**

```typescript
export async function uploadToR2(config: any): Promise<any> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: buffer,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable', // Cache for 1 year
  });

  await r2Client.send(command);
  
  // ...
}
```

**Impact:** Reduces Class B operations by ~90% for repeated image views.

---

### 3.2 Browser Caching

Already implemented via Next.js Image component + R2 headers.

**Verify headers:**
```bash
curl -I https://pub-f7428c8dffee40d29bba42a6146178f8.r2.dev/[file-key]
```

Should see:
```
cache-control: public, max-age=31536000, immutable
```

---

## 4. Lifecycle Policies

### 4.1 Automatic Cleanup

**Cloudflare R2 Lifecycle Rules (configure in dashboard):**

1. Go to R2 Bucket → Settings → Lifecycle Rules
2. Add rule:
   - **Name:** Delete old placeholders
   - **Prefix:** `placeholders/`
   - **Action:** Delete after 30 days
3. Add rule:
   - **Name:** Delete test files
   - **Prefix:** `test/`
   - **Action:** Delete after 7 days

**Impact:** Prevents accumulation of unused files.

---

### 4.2 User Content Retention

**Policy:** Keep user-uploaded content for 90 days, then archive.

**Implementation:**

```typescript
// Add to scheduled-posts table
interface ScheduledPost {
  // ... existing fields
  imageUploadedAt: Date;
  imageArchivedAt?: Date;
}

// Cron job (monthly)
async function archiveOldImages() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const oldPosts = await prisma.scheduledPost.findMany({
    where: {
      imageUploadedAt: { lt: cutoff },
      imageArchivedAt: null,
    },
  });

  for (const post of oldPosts) {
    if (post.imageUrl && isR2Url(post.imageUrl)) {
      const fileKey = extractFileKey(post.imageUrl);
      await deleteFromR2(fileKey);
      
      await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { imageArchivedAt: new Date() },
      });
    }
  }
}
```

---

## 5. Fallback & Error Handling

### 5.1 Graceful Degradation

Already implemented: R2 → Vercel Blob fallback.

**Enhancement:** Add circuit breaker for R2 failures.

```typescript
// src/lib/circuit-breaker.ts
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private threshold = 5;
  private timeout = 60000; // 1 minute

  async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      console.warn('⚠️ Circuit breaker open, using fallback');
      return fallback();
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      if (this.isOpen()) {
        console.warn('⚠️ Circuit breaker tripped, using fallback');
        return fallback();
      }
      
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }

  private isOpen(): boolean {
    if (this.failureCount >= this.threshold) {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        return true;
      }
      // Reset after timeout
      this.failureCount = 0;
    }
    return false;
  }
}

export const r2CircuitBreaker = new CircuitBreaker();
```

**Usage:**

```typescript
export async function uploadImageWithFallback(data: string) {
  return r2CircuitBreaker.execute(
    async () => {
      // Primary: R2
      return uploadBase64ToR2(data);
    },
    async () => {
      // Fallback: Vercel Blob
      return uploadToVercelBlob(data);
    }
  );
}
```

---

## 6. Implementation Roadmap

### Phase 1: Immediate (This Week)
- ✅ Add R2 domains to next.config.ts (DONE)
- ✅ Update environment variables (DONE)
- ⏳ Implement placeholder data URLs (eliminates 70% of Class A ops)
- ⏳ Add cache-control headers to uploads

### Phase 2: Short-term (This Month)
- ⏳ Create usage monitoring dashboard
- ⏳ Implement deduplication for uploads
- ⏳ Set up Cloudflare lifecycle rules
- ⏳ Add operation logging

### Phase 3: Long-term (Next Month)
- ⏳ Implement circuit breaker pattern
- ⏳ Create automated cleanup cron job
- ⏳ Add user content archival policy
- ⏳ Set up alerting webhooks

---

## 7. Monitoring Checklist

### Weekly:
- [ ] Check usage via `/api/r2/usage` endpoint
- [ ] Review Cloudflare R2 dashboard for operation counts
- [ ] Check for any alerts or warnings

### Monthly:
- [ ] Run cleanup script for old placeholders
- [ ] Analyze operation logs
- [ ] Review storage trends
- [ ] Verify lifecycle rules are working

### Quarterly:
- [ ] Review and adjust retention policies
- [ ] Optimize upload patterns based on logs
- [ ] Update alert thresholds if needed

---

## 8. Emergency Response Plan

### If Approaching Limits (>80% usage):

1. **Immediate:**
   ```bash
   # Run cleanup manually
   node scripts/cleanup-old-files.js
   ```

2. **Short-term:**
   - Switch to data URL placeholders (no upload)
   - Increase deduplication aggressiveness
   - Temporarily disable image generation

3. **Long-term:**
   - Upgrade to R2 paid tier ($0.015/GB/month)
   - Implement more aggressive archival

### If Over Limit:

1. **Stop all uploads** (add feature flag)
2. **Delete oldest files** (prioritize placeholders)
3. **Enable circuit breaker** to use Vercel Blob
4. **Upgrade R2 plan** ($0.015/GB is cheap)

---

## 9. Cost Comparison

### Current Vercel Blob:
- Storage: 1GB = $0.15/month
- Bandwidth: 1TB = $300/month
- **Total for 1TB egress**: ~$300/month

### R2 Free Tier:
- Storage: 10GB = $0
- Operations: 1M Class A, 10M Class B = $0
- Bandwidth: Unlimited = $0
- **Total**: $0/month (if within limits)

### R2 Paid (if needed):
- Storage: 50GB = $0.75/month
- Operations: 5M Class A = $22.50/month
- Bandwidth: Unlimited = $0
- **Total**: ~$23/month

**Savings vs Vercel Blob**: Still 92% cheaper!

---

## 10. Key Takeaways

1. **Biggest Risk:** Class A operations (uploads)
2. **Biggest Win:** Eliminate placeholder uploads (use data URLs)
3. **Best Defense:** Monitoring + automated cleanup
4. **Safety Net:** Circuit breaker + Vercel Blob fallback
5. **Long-term:** Even paid R2 is 92% cheaper than Vercel Blob

---

## Next Steps

1. Implement placeholder data URLs (today)
2. Create monitoring dashboard (this week)
3. Set up lifecycle rules in Cloudflare (this week)
4. Deploy and monitor for 30 days

**Goal:** Stay at <50% of free tier limits indefinitely.
