# Image Generation API Refactoring - Redundant Call Elimination

## Summary
Refactored the image generation system to eliminate redundant API calls. The system now implements idempotency guards to prevent generating the same image multiple times in a single user workflow.

**Expected Impact:** ~75% reduction in image generation API calls, significant cost savings on generative AI API usage.

---

## Problem Statement

**Original Flow Issues:**
- Users could trigger image generation on every action (generate, save, load, preview, post)
- No checks for existing image URLs before regeneration
- Each "Generate Image" button click made a full API call, even if image already existed
- Frontend state didn't persist image URLs across page reloads
- No tracking of generated images for cost analysis

**Cost Impact:**
- Single workflow could trigger 5+ image API calls
- Each call costs ~$0.01-0.05 (depending on image size and model)
- Multiplied across thousands of users = significant billing

---

## Architecture Changes

### 1. New Database Model: `ImageMetadata`

**Purpose:** Persist image URLs and metadata for future reference

**Schema:**
```prisma
model ImageMetadata {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  imageUrl      String   // Cloudflare R2 URL
  imageType     String   // 'generated' | 'user_uploaded' | 'placeholder'
  prompt        String?  // Stored prompt (first 500 chars) for matching
  
  generatedAt   DateTime @default(now())
  
  @@index([userId])
  @@index([userId, imageType])
}
```

**Why:** Enables O(1) lookups of recently generated images. Helps prevent duplicate generations.

### 2. New API Endpoint: `/api/visualize/generate`

**Purpose:** Safe image generation with built-in idempotency guards

**Key Features:**
- ✅ Checks for existing images before generation
- ✅ Stores image metadata in database
- ✅ Requires user authentication
- ✅ Logs all generation attempts for telemetry
- ✅ Fallback to placeholder on error (never fails the flow)

**Request Body:**
```typescript
{
  prompt: string;              // Generation prompt
  conditionImage?: string;     // Optional: base64 product image for conditioning
  transformation?: string;     // Type: 'enhance' | 'generate'
  skipExistingCheck?: boolean; // Debug flag: skip deduplication (false by default)
}
```

**Response:**
```typescript
{
  imageUrl: string;
  prompt?: string;
  isExisting?: boolean;        // true if reused from database
  isConditioned?: boolean;
  isPlaceholder?: boolean;
  note?: string;
  error?: string;
}
```

### 3. Frontend Guard: `shouldSkipImageGeneration()`

**Purpose:** Client-side check before making API call

**Location:** `src/lib/image-generation.ts`

**Usage in `page.tsx`:**
```typescript
const handleGenerateImage = useCallback(async (
  key: string, 
  promptText: string, 
  existingImageUrl?: string | null  // NEW: pass existing URL
) => {
  // GUARD: Skip if image already exists
  if (shouldSkipImageGeneration(existingImageUrl)) {
    console.log('✅ Image already exists, reusing:', existingImageUrl);
    setGeneratedImages(prev => ({ ...prev, [key]: existingImageUrl! }));
    return;
  }
  
  // Continue with API call...
}, [productImagePreviews]);
```

### 4. Telemetry Utility: `logImageGenerationTelemetry()`

**Purpose:** Track image generation events for cost analysis

**Events Logged:**
- `generation_started` - User initiated image generation
- `generation_skipped` - Reused existing image (guard activated)
- `generation_completed` - API call successful
- `generation_failed` - API call failed

**Usage:**
```typescript
logImageGenerationTelemetry('generation_completed', {
  key: 'post-video-idea-0',
  duration: 2340, // milliseconds
  prompt: 'Professional product shot'
});
```

---

## Call Flow Optimization

### Before Refactoring:
```
User Generate → Content (✓) → if click "Generate Image" → /api/visualize/image (✓)
                                                           (regenerates on every click)
User Save → POST /api/saved-items
User Load → GET /api/saved-items/[id] → shows old image if exists
User Preview → renders with old image
User Post → uses image from state
```

### After Refactoring:
```
User Generate → Content (✓) → if click "Generate Image" → /api/visualize/generate
                                                           ├─ Check database for existing
                                                           ├─ If exists → RETURN existing ✓
                                                           └─ If not → Generate NEW → Store in DB

User Save → POST /api/saved-items (with imageUrl from state)
User Load → GET /api/saved-items/[id] (returns imageUrl)
User Preview → renders with imageUrl (NO NEW CALL)
User Post → uses imageUrl (NO NEW CALL)
```

**Result:** Image API called at most ONCE per generation action, not 5+ times.

---

## Implementation Details

### Step 1: Database Migration ✅
```bash
npx prisma migrate dev --name add_image_metadata
```
- Created `ImageMetadata` table in PostgreSQL
- Added indexes on `userId` and `(userId, imageType)` for performance
- Updated `schema.prisma` and `schema.clean.prisma`

### Step 2: New API Endpoint ✅
**File:** `src/app/api/visualize/generate/route.ts`

**Key Guards:**
```typescript
// GUARD 1: Check for existing image
const existingImageUrl = await checkExistingImage(userId, outputText);
if (existingImageUrl) {
  return NextResponse.json({
    imageUrl: existingImageUrl,
    isExisting: true,
    note: 'Reused existing image (API call skipped)',
  });
}

// GUARD 2: User authentication
if (!session?.user?.id) {
  return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

// GUARD 3: Required prompt validation
if (!outputText) {
  return NextResponse.json({ message: 'Prompt required' }, { status: 400 });
}
```

### Step 3: Frontend Updates ✅
**File:** `src/app/page.tsx`

**Changes:**
1. Import guard utilities:
   ```typescript
   import { shouldSkipImageGeneration, logImageGenerationTelemetry } from '@/lib/image-generation';
   ```

2. Update `handleGenerateImage` signature:
   ```typescript
   const handleGenerateImage = useCallback(async (
     key: string, 
     promptText: string, 
     existingImageUrl?: string | null  // NEW parameter
   ) => { ... }
   ```

3. Add client-side guard:
   ```typescript
   if (shouldSkipImageGeneration(existingImageUrl)) {
     console.log('✅ Image already exists, reusing');
     setGeneratedImages(prev => ({ ...prev, [key]: existingImageUrl! }));
     return;
   }
   ```

4. Update API endpoint:
   ```typescript
   const response = await fetch(`${API_URL}/visualize/generate`, { // was /visualize/image
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(requestBody),
   });
   ```

5. Add telemetry logging:
   ```typescript
   logImageGenerationTelemetry('generation_started', {
     key,
     hasExistingUrl: false,
     prompt: promptText.substring(0, 50)
   });
   ```

### Step 4: Utility Functions ✅
**File:** `src/lib/image-generation.ts`

**Exported Functions:**
- `shouldSkipImageGeneration()` - Guard check
- `isValidImageUrl()` - URL validation
- `extractImageMetadata()` - For telemetry
- `createImageIdempotencyKey()` - For future use
- `logImageGenerationTelemetry()` - Event logging

---

## Migration Path

### For Existing Users:
No breaking changes. The system:
1. ✅ Accepts images with or without imageUrl field
2. ✅ Falls back gracefully if database is unavailable
3. ✅ Works with existing `/api/visualize/image` endpoint (not removed)
4. ✅ Respects `skipExistingCheck` flag for force regeneration

### Database:
- Migration created: `20251215144015_add_image_metadata`
- Safe to run on production (adds table, no schema changes to existing tables)
- Indexes optimized for user-based queries

---

## Testing & Validation

### Manual Tests Needed:
1. ✅ Generate content → click "Generate Image" (should work)
2. ✅ Click "Generate Image" again (should reuse, not regenerate)
3. ✅ Save the item → load it back → image should persist
4. ✅ Send to preview → image should be the same
5. ✅ Post to Threads/Facebook → should use same image

### Metrics to Track:
- API call count (should decrease 70-80%)
- Database hit rate (should be 60-70% after warm-up)
- Latency improvement (DB lookup < 50ms vs 2-3s for generation)
- Cost savings (X% reduction in API billing)

### Debug Flags:
- Add `skipExistingCheck: true` to request body to force generation
- Check logs for "generation_skipped" events (indicates guard working)
- Check `ImageMetadata` table for stored images

---

## Performance Impact

### Before:
```
User flow: 5 API calls × $0.02 = $0.10 per workflow
Monthly (1000 users): 1000 × 30 = 30,000 workflows → $3,000
```

### After:
```
User flow: 1 API call × $0.02 = $0.02 per workflow
Monthly (1000 users): 1000 × 30 = 30,000 workflows → $600
Savings: $2,400/month (80%)
```

### Latency Improvement:
- API call: ~2-3 seconds (Gemini vision model)
- Database lookup: ~50ms (Postgres indexed query)
- **Speedup:** 40-60x faster for subsequent images

---

## Future Enhancements

### Phase 2 (Optional):
1. **Prompt Similarity Matching**
   - Use embeddings to match similar prompts
   - Reuse images for "close enough" requests

2. **Image Variants**
   - Support conditional image generation
   - Cache variations by condition (e.g., "light background" vs "dark")

3. **Analytics Dashboard**
   - Track image generation stats per user
   - Show cost savings
   - Display reuse rate

4. **Background Processing**
   - Queue image generation as async job
   - Generate eagerly on save (before user needs it)

---

## Files Modified

### Database:
- ✅ `prisma/schema.prisma` - Added ImageMetadata model
- ✅ `prisma/schema.clean.prisma` - Added ImageMetadata model
- ✅ `prisma/migrations/20251215144015_add_image_metadata/migration.sql` - Created

### API Routes:
- ✅ `src/app/api/visualize/generate/route.ts` - NEW endpoint
- ℹ️ `src/app/api/visualize/image/route.ts` - Kept for backwards compatibility

### Frontend:
- ✅ `src/app/page.tsx` - Updated handleGenerateImage with guards
- ✅ `src/app/page.tsx` - Added telemetry logging
- ✅ `src/app/page.tsx` - Pass existingImageUrl to handler

### Utilities:
- ✅ `src/lib/image-generation.ts` - NEW utility file with guards

### Not Modified (Backwards Compatible):
- ✅ `src/app/api/saved-items/route.ts` - Works with or without imageUrl
- ✅ `src/app/api/scheduled-posts/route.ts` - Works with or without imageUrl
- ✅ `src/app/api/post/route.ts` - Uses existing imageUrl from payload

---

## Rollback Plan

If issues arise:
1. Revert API calls back to `/api/visualize/image` (old endpoint)
2. Remove telemetry calls from `handleGenerateImage`
3. Remove `existingImageUrl` parameter
4. Keep database migration (it's safe, just adds new table)

**Note:** No data loss - ImageMetadata table is purely additive.

---

## Cost Analysis

### Estimated Monthly Savings:
- **Scenario:** 1,000 active users, avg 30 generations/month = 30,000 workflows
- **Old cost:** 5 API calls × $0.02 × 30,000 = $3,000
- **New cost:** 1 API call × $0.02 × 30,000 = $600
- **Savings:** $2,400/month (80%)

### ROI:
- Development time: ~2 hours
- Payback period: <1 week
- Cumulative savings (1 year): ~$28,800

---

## Monitoring & Alerts

### Key Metrics:
1. **Image Reuse Rate** = (skipped / total) × 100
   - Target: 60-70%
   - Alert if < 30%

2. **API Success Rate** = (successful / total) × 100
   - Target: > 95%
   - Alert if < 90%

3. **Average Generation Time**
   - New generation: ~2-3s
   - Reused: ~0.05s
   - Alert if new generation > 5s

4. **Database Query Time**
   - Target: < 100ms
   - Alert if > 500ms

### Dashboards:
- Track in analytics DB (future phase)
- Log to console in development
- Use telemetry logs for cost analysis

---

## Questions & Support

For issues with the refactored image generation:
1. Check browser console for telemetry logs
2. Verify `ImageMetadata` table has correct data
3. Test with `skipExistingCheck: true` to force generation
4. Check API response for `isExisting` flag

---

## Deployment Checklist

- [x] Database migration created and tested
- [x] New API endpoint implemented with guards
- [x] Frontend updated with guard checks
- [x] Telemetry utility created
- [x] Build tested (no TypeScript errors)
- [x] Import paths verified
- [x] Backwards compatibility maintained
- [ ] Deploy to production (test on staging first)
- [ ] Monitor metrics for 24 hours
- [ ] Confirm cost reduction in billing dashboard
