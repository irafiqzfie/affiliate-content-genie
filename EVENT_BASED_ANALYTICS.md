# Event-Based Analytics System

## Overview

The Stats tracking system has been refactored to use an **immutable, append-only event log** architecture. This ensures that analytics data remains accurate and permanent, even when users delete their Saved Ideas or Post History records.

## Problem Statement

**Before:** Stats were calculated by counting `SavedItem` and `ScheduledPost` records:
- When users deleted saved ideas, the "Content Generated" count decreased
- When users deleted post history, the "Content Posted" count decreased
- Historical analytics charts lost data points when records were deleted
- Stats became inaccurate over time as users managed their content

**After:** Stats are tracked through immutable `AnalyticsEvent` records:
- Events are write-once and never deleted
- Deleting SavedItem or ScheduledPost has **no effect** on stats
- Historical analytics remain accurate forever
- Stats represent true user activity over time

## Architecture

### Database Model

```prisma
model AnalyticsEvent {
  id        String   @id @default(cuid())
  userId    String
  eventType String   // 'content_generated' or 'content_posted'
  platform  String?  // e.g., 'threads', 'facebook', 'instagram', null for generated
  timestamp DateTime @default(now())
  monthKey  String   // Format: 'YYYY-MM' for efficient aggregation
  yearKey   String   // Format: 'YYYY' for yearly aggregation

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, eventType, monthKey])
  @@index([userId, eventType, yearKey])
  @@index([userId, timestamp])
}
```

### Event Types

1. **`content_generated`**
   - Logged when: User generates content via `/api/saved-items` POST
   - Platform: `null` (generated content has no platform yet)
   - Represents: Content creation activity

2. **`content_posted`**
   - Logged when: User schedules a post via `/api/scheduled-posts` POST
   - Platform: The target platform (threads, facebook, instagram, etc.)
   - Represents: Content publishing activity

## Implementation

### 1. Event Logging

Events are automatically logged when users perform key actions:

**Content Generation** (`src/app/api/saved-items/route.ts`):
```typescript
const newItem = await prisma.savedItem.create({ data: dataToCreate });

// Log analytics event (immutable, append-only)
const now = new Date();
await prisma.analyticsEvent.create({
  data: {
    userId,
    eventType: 'content_generated',
    platform: null,
    timestamp: now,
    monthKey: now.toISOString().substring(0, 7), // YYYY-MM
    yearKey: now.toISOString().substring(0, 4),   // YYYY
  },
});
```

**Content Posting** (`src/app/api/scheduled-posts/route.ts`):
```typescript
const newPost = await prisma.scheduledPost.create({ data: postData });

// Log analytics event (immutable, append-only)
const now = new Date();
await prisma.analyticsEvent.create({
  data: {
    userId,
    eventType: 'content_posted',
    platform,
    timestamp: now,
    monthKey: now.toISOString().substring(0, 7), // YYYY-MM
    yearKey: now.toISOString().substring(0, 4),   // YYYY
  },
});
```

### 2. Stats Calculation

The `/api/stats` endpoint now reads from `AnalyticsEvent` instead of counting records:

```typescript
// Fetch all analytics events for this user (immutable, append-only)
const events = await prisma.analyticsEvent.findMany({
  where: { userId },
  select: {
    eventType: true,
    platform: true,
    timestamp: true,
    monthKey: true,
    yearKey: true,
  },
  orderBy: { timestamp: 'asc' },
});

// Aggregate by month and event type
events.forEach(event => {
  if (event.eventType === 'content_generated') {
    totalGenerated++;
    monthlyGenerated[event.monthKey] = (monthlyGenerated[event.monthKey] || 0) + 1;
    yearlyGenerated[event.yearKey] = (yearlyGenerated[event.yearKey] || 0) + 1;
  } else if (event.eventType === 'content_posted') {
    totalPosted++;
    monthlyPosted[event.monthKey] = (monthlyPosted[event.monthKey] || 0) + 1;
    yearlyPosted[event.yearKey] = (yearlyPosted[event.yearKey] || 0) + 1;
    platformBreakdown[event.platform] = (platformBreakdown[event.platform] || 0) + 1;
  }
});
```

### 3. Backfilling Historical Data

For existing users, use the backfill endpoint to migrate historical data:

**Endpoint:** `POST /api/backfill-events`

**What it does:**
- Reads all existing `SavedItem` records for the authenticated user
- Reads all existing `ScheduledPost` records for the authenticated user
- Creates corresponding `AnalyticsEvent` records with original timestamps
- Only runs if no events exist (prevents duplicates)

**Usage:**
```bash
# Call from the frontend or via curl
curl -X POST https://your-app.vercel.app/api/backfill-events \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "message": "Backfill completed successfully",
  "generatedCount": 42,
  "postedCount": 35,
  "totalEvents": 77
}
```

## Migration Steps

1. **Deploy Schema Changes**
   ```bash
   npx prisma migrate deploy
   ```

2. **Generate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Backfill Existing Data** (for each user)
   - Option A: Call `/api/backfill-events` from the frontend
   - Option B: Run a one-time script to backfill all users

4. **Verify Stats**
   - Check Stats page to ensure data is correct
   - Delete a SavedItem and verify stats remain unchanged
   - Delete a ScheduledPost and verify stats remain unchanged

## Benefits

✅ **Immutable Analytics**: Events are never modified or deleted  
✅ **Accurate History**: Stats reflect true user activity over time  
✅ **Deletion-Safe**: Deleting SavedItem/ScheduledPost doesn't affect stats  
✅ **Efficient Queries**: Indexed by userId, eventType, monthKey, yearKey  
✅ **Platform Insights**: Track which platforms users prefer  
✅ **Audit Trail**: Complete history of user content creation activity  

## Data Integrity

### What Happens When Users Delete Records?

| Action | SavedItem Table | ScheduledPost Table | AnalyticsEvent Table | Stats Impact |
|--------|----------------|---------------------|---------------------|--------------|
| Delete Saved Idea | ✅ Record deleted | - | ❌ No change | ✅ Stats unchanged |
| Delete Post History | - | ✅ Record deleted | ❌ No change | ✅ Stats unchanged |
| Delete User Account | ✅ All deleted | ✅ All deleted | ✅ All deleted* | ✅ User data removed |

*Note: AnalyticsEvent has `onDelete: Cascade` on the userId foreign key, so events are deleted when the user account is deleted (GDPR compliance).

## Performance Considerations

- **monthKey** and **yearKey** are pre-computed for fast aggregation
- Indexes optimize common query patterns:
  - `[userId, eventType, monthKey]` - Monthly stats by type
  - `[userId, eventType, yearKey]` - Yearly stats by type
  - `[userId, timestamp]` - Time-range queries
- No expensive joins required for stats calculation

## Future Enhancements

Potential improvements to the event system:

1. **Event Metadata**: Add JSON field for additional context (product link, AI model used, etc.)
2. **Event Batching**: Batch event writes for high-volume operations
3. **Event Replay**: Recalculate stats from event log if needed
4. **Event Retention**: Optional data retention policies (e.g., keep events for 2 years)
5. **Event Export**: Allow users to export their analytics history

## Backward Compatibility

The system maintains backward compatibility:

- ✅ SavedItem and ScheduledPost tables remain unchanged
- ✅ Existing features continue to work normally
- ✅ UI code requires no changes
- ✅ Only stats calculation logic was updated

## Monitoring

To monitor the event system:

```sql
-- Check event counts by type
SELECT eventType, COUNT(*) 
FROM AnalyticsEvent 
WHERE userId = 'user-id'
GROUP BY eventType;

-- Check event distribution by month
SELECT monthKey, eventType, COUNT(*) 
FROM AnalyticsEvent 
WHERE userId = 'user-id'
GROUP BY monthKey, eventType
ORDER BY monthKey DESC;

-- Check if user needs backfill
SELECT COUNT(*) FROM AnalyticsEvent WHERE userId = 'user-id';
```

## Testing

To verify the system works correctly:

1. **Generate Content**: Create a new saved idea via the UI
2. **Check Events**: Verify `AnalyticsEvent` record was created
3. **View Stats**: Confirm stats page shows the new content
4. **Delete Content**: Delete the saved idea
5. **Verify Stats**: Confirm stats page still shows the same count
6. **Schedule Post**: Create a new scheduled post
7. **Check Events**: Verify `AnalyticsEvent` record was created with platform
8. **View Stats**: Confirm stats page shows the new post
9. **Delete Post**: Delete the scheduled post
10. **Verify Stats**: Confirm stats page still shows the same count

---

**Questions?** Check the implementation files:
- Schema: `prisma/schema.prisma`
- Stats API: `src/app/api/stats/route.ts`
- Event Logging: `src/app/api/saved-items/route.ts`, `src/app/api/scheduled-posts/route.ts`
- Backfill: `src/app/api/backfill-events/route.ts`
