# Local Testing Guide - Image Generation Refactoring

## Quick Start Testing (5 minutes)

### Test 1: Basic Image Generation Flow
1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:** http://localhost:3000

3. **Open DevTools Console** (F12)

4. **Test workflow:**
   - Paste a product link and click "Analyze"
   - Click "Generate" content
   - Upload a product image (or skip)
   - Click "🎨 Visualize Image" button
   - **Watch console logs** - you should see:
     ```
     🎨 Image generation requested for key: video-idea-0
     📡 Sending enhanced request to /api/visualize/generate
     ✅ Generated image successfully
     📊 [Image Generation Telemetry] generation_completed
     ```

5. **Click "🎨 Visualize Image" again** on the same content
   - **Expected console output:**
     ```
     ✅ Image already exists, reusing: data:image/jpeg;base64...
     📊 [Image Generation Telemetry] generation_skipped
     ```
   - **✅ SUCCESS:** Guard is working! No API call made.

### Test 2: Save & Load Flow
1. **Save the generated content:**
   - Click "💾 Save Content" button
   - Verify save successful

2. **Refresh the page** (F5)

3. **Load the saved item:**
   - Go to "Saved Content" tab
   - Click on your saved item

4. **Check console logs:**
   - Should NOT see any image generation API calls
   - Image should load from saved data
   - **✅ SUCCESS:** No regeneration on load

### Test 3: Preview & Post Flow
1. **With generated content loaded:**
   - Click "📤 Send to Preview" button
   - Preview modal should show existing image
   - **Check console:** No image generation calls

2. **Close preview, open again:**
   - Image should still be the same
   - **Check console:** Still no generation calls

3. **Click "Post Now":**
   - Image sent to Threads/Facebook
   - **Check console:** No regeneration
   - **✅ SUCCESS:** Image reused throughout entire flow

---

## Expected Console Output Examples

### ✅ CORRECT - First Generation (API Call Made)
```
🎨 Image generation requested for key: video-idea-0
📊 [Image Generation Telemetry] generation_started: {
  timestamp: '2024-12-15T14:40:15.234Z',
  event: 'generation_started',
  key: 'video-idea-0',
  hasExistingUrl: false,
  prompt: 'Professional product shot'
}
📡 Sending enhanced request to /api/visualize/generate
🖼️ Using uploaded image as reference for image generation
📊 Image analysis: This product appears to be...
🎨 Generating new image...
✅ Generated image successfully
📊 [Image Generation Telemetry] generation_completed: {
  timestamp: '2024-12-15T14:40:17.123Z',
  event: 'generation_completed',
  key: 'video-idea-0',
  duration: 2340,
  prompt: 'Professional product shot'
}
```

### ✅ CORRECT - Subsequent Clicks (Guard Activated)
```
🎨 Image generation requested for key: video-idea-0
✅ Image already exists, reusing: data:image/jpeg;base64,/9j/4AAQSkZ...
📊 [Image Generation Telemetry] generation_skipped: {
  timestamp: '2024-12-15T14:40:20.456Z',
  event: 'generation_skipped',
  key: 'video-idea-0',
  hasExistingUrl: true,
  prompt: 'Professional product shot'
}
```

### ❌ INCORRECT - Regenerating Every Time (Bug)
```
🎨 Image generation requested for key: video-idea-0
📡 Sending enhanced request to /api/visualize/generate  <-- BAD: Should skip!
📊 Image analysis: This product appears to be...
🎨 Generating new image...  <-- BAD: Redundant API call
```

---

## Database Verification

### Check ImageMetadata Table
```bash
npx prisma studio
```

Then:
1. Navigate to `ImageMetadata` model
2. Verify records are being created with:
   - `userId` populated
   - `imageUrl` stored (either data URL or external URL)
   - `imageType` = 'generated' or 'placeholder'
   - `prompt` truncated to 500 chars
   - `generatedAt` timestamp

### SQL Query (Optional)
```sql
SELECT COUNT(*) as total_images,
       imageType,
       DATE(generatedAt) as date
FROM "ImageMetadata"
GROUP BY imageType, DATE(generatedAt)
ORDER BY date DESC;
```

---

## Performance Metrics

### Measure API Call Count
Open Network tab in DevTools and filter for:
- `/api/visualize/generate` - Should only appear ONCE per unique content
- `/api/visualize/image` - Should NOT appear (old endpoint)

### Measure Latency
**First generation:**
- Expected: 2-3 seconds (AI processing)
- Status: ✅ Normal

**Subsequent clicks:**
- Expected: < 100ms (client-side guard)
- Status: ✅ Fast

---

## Common Issues & Troubleshooting

### Issue 1: "Image regenerates every time"
**Cause:** existingImageUrl not being passed correctly

**Fix:** Check page.tsx button calls:
```typescript
// CORRECT:
onClick={() => handleGenerateImage(optionKey, selectedOption, generatedImage)}

// WRONG:
onClick={() => handleGenerateImage(optionKey, selectedOption)} // Missing 3rd param
```

### Issue 2: "Cannot read property 'imageMetadata'"
**Cause:** Prisma client not regenerated after migration

**Fix:**
```bash
npx prisma generate
npm run dev
```

### Issue 3: "401 Unauthorized" on /api/visualize/generate
**Cause:** Not logged in or session expired

**Fix:** Sign in to the app first, then test

### Issue 4: "Database not found" error
**Cause:** Migration not applied

**Fix:**
```bash
npx prisma migrate dev
npx prisma generate
```

---

## Test Checklist

### Basic Functionality
- [ ] Can generate content without errors
- [ ] Can click "Visualize Image" and see image appear
- [ ] Console shows telemetry logging
- [ ] Clicking image button again shows "generation_skipped"
- [ ] Image persists after page refresh (if saved)

### Database Integration
- [ ] ImageMetadata table exists in database
- [ ] Records created after image generation
- [ ] UserId correctly associated with images
- [ ] No duplicate entries for same content

### API Endpoint
- [ ] `/api/visualize/generate` returns 200 OK
- [ ] Response includes `imageUrl` field
- [ ] Response includes `isExisting` flag when reusing
- [ ] Authentication required (401 when not logged in)

### Frontend Guards
- [ ] `shouldSkipImageGeneration()` returns true when URL exists
- [ ] Telemetry events logged for all scenarios
- [ ] No regeneration on save/load/preview/post
- [ ] Image state persists across tab switches

### Performance
- [ ] First generation: 2-3 seconds (acceptable)
- [ ] Subsequent clicks: < 100ms (instant)
- [ ] No network requests after first generation
- [ ] Database lookup time < 50ms (check Prisma logs)

---

## Success Criteria

**ALL of these must be true:**

✅ Console shows "generation_skipped" on 2nd+ button clicks
✅ Network tab shows only 1 API call per unique content
✅ Image persists after save → load → preview → post
✅ ImageMetadata table has records after generation
✅ No TypeScript errors in browser console
✅ Build succeeds with `npm run build`

---

## Advanced Testing (Optional)

### Test Multiple Users
1. Sign in as User A → generate image
2. Sign out, sign in as User B → generate image
3. Check ImageMetadata table:
   - Each user should have separate records
   - userId should match session user

### Test Error Handling
1. Stop database connection (kill postgres)
2. Try to generate image
3. Should fall back to placeholder gracefully
4. No crashes or unhandled errors

### Test Idempotency
1. Generate image with prompt "Product A"
2. Generate again with same prompt
3. Check database: Should reuse existing image
4. Check API: No new generation call made

---

## Deploy to Staging

Once local testing passes:

```bash
# Commit changes
git add .
git commit -m "feat: image generation refactoring with idempotency guards"
git push origin main

# Deploy will automatically:
# 1. Run database migrations
# 2. Build project
# 3. Deploy to Vercel/production
```

**Monitor for 24 hours:**
- Image generation API call count (should drop 70-80%)
- Error rate (should remain < 5%)
- User complaints (should be zero)
- Billing dashboard (should see cost reduction)

---

## Rollback Instructions

If critical issues found:

```bash
# Revert the commit
git revert HEAD
git push origin main

# Old endpoint still works, no data loss
```

---

## Support

For issues during testing:
1. Check console logs for telemetry events
2. Verify ImageMetadata records in database
3. Test with `skipExistingCheck: true` flag (forces regeneration)
4. Review [IMAGE_GENERATION_REFACTORING.md](IMAGE_GENERATION_REFACTORING.md)
