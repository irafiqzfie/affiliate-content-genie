# Dual OAuth System - Complete Implementation Checklist

## ✅ Files Created/Modified

### Core Implementation
- [x] `prisma/schema.prisma` - Extended Account model
- [x] `src/lib/oauth-helpers.ts` - OAuth utilities (token storage, refresh, security)
- [x] `src/types/next-auth.d.ts` - TypeScript type extensions

### API Routes
- [x] `src/app/api/auth/threads/connect/route.ts` - Threads OAuth flow
- [x] `src/app/api/auth/facebook/connect/route.ts` - Facebook Pages OAuth flow
- [x] `src/app/api/auth/connections/route.ts` - Get user connections
- [x] `src/app/api/auth/disconnect/route.ts` - Disconnect provider
- [x] `src/app/api/post/route.ts` - Unified posting endpoint

### UI Components
- [x] `src/app/components/ConnectionsManager.tsx` - Connection management dashboard
- [x] `src/app/components/PostComposer.tsx` - Post creation interface

### Documentation
- [x] `DUAL_OAUTH_GUIDE.md` - Comprehensive technical guide
- [x] `QUICK_SETUP.md` - 10-minute setup guide
- [x] `IMPLEMENTATION_SUMMARY.md` - Implementation overview
- [x] `CHECKLIST.md` - This file

---

## 📋 Setup Steps (Do These Next)

### 1. Database Migration
```bash
# Apply the schema changes
npx prisma migrate dev --name add_oauth_fields

# Verify migration
npx prisma studio
```

**What this does:**
- Adds platform-specific fields to Account table
- Creates indexes for performance
- Updates foreign key constraints

---

### 2. Environment Variables

Add to `.env.local`:

```bash
# Threads OAuth
THREADS_APP_ID=your_threads_app_id_here
THREADS_APP_SECRET=your_threads_app_secret_here

# Facebook OAuth (update if needed)
FACEBOOK_CLIENT_ID=1340853470991732
FACEBOOK_CLIENT_SECRET=your_secret_here

# NextAuth (already configured)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

**Get Threads credentials:**
1. Visit https://developers.facebook.com/
2. Select your app
3. Add "Threads" product
4. Copy App ID and App Secret

---

### 3. Configure Facebook App

**Login Settings → OAuth Redirect URIs:**
```
http://localhost:3000/api/auth/facebook/connect
https://www.inabiz.online/api/auth/facebook/connect
```

**Settings → Basic → App Domains:**
```
localhost
www.inabiz.online
inabiz.online
```

**App Review → Request Permissions:**
- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `business_management`

---

### 4. Configure Threads App

**Settings → Redirect URIs:**
```
http://localhost:3000/api/auth/threads/connect
https://www.inabiz.online/api/auth/threads/connect
```

**Permissions:**
- `threads_basic`
- `threads_content_publish`

---

### 5. Add Components to Your UI

**Option A: Add to existing dashboard**
```tsx
// src/app/dashboard/page.tsx or similar
import ConnectionsManager from '@/app/components/ConnectionsManager';
import PostComposer from '@/app/components/PostComposer';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      
      {/* Manage connections */}
      <ConnectionsManager />
      
      {/* Create posts */}
      <PostComposer />
    </div>
  );
}
```

**Option B: Create dedicated pages**
```tsx
// src/app/connections/page.tsx
import ConnectionsManager from '@/app/components/ConnectionsManager';
export default function ConnectionsPage() {
  return <ConnectionsManager />;
}

// src/app/create-post/page.tsx
import PostComposer from '@/app/components/PostComposer';
export default function CreatePostPage() {
  return <PostComposer />;
}
```

---

## 🧪 Testing Checklist

### Connection Testing
- [ ] Start dev server: `npm run dev`
- [ ] Navigate to ConnectionsManager component
- [ ] Click "Connect Threads"
- [ ] Authorize on Threads OAuth page
- [ ] Verify redirect back with success message
- [ ] Check database: Account record with provider='threads'
- [ ] Click "Connect Facebook Pages"
- [ ] Select pages to connect
- [ ] Verify redirect back with success
- [ ] Check database: Account records with provider='facebook-pages'
- [ ] Verify ConnectionsManager shows "Connected" status
- [ ] Test "Disconnect" buttons

### Posting Testing
- [ ] Navigate to PostComposer component
- [ ] Enter post text
- [ ] Add image URL (optional)
- [ ] Select "Threads" platform
- [ ] Click "Publish Post"
- [ ] Verify post appears on Threads
- [ ] Select "Facebook Pages" platform
- [ ] Select one or more pages
- [ ] Click "Publish Post"
- [ ] Verify post appears on selected Facebook Pages
- [ ] Select both platforms
- [ ] Click "Publish Post"
- [ ] Verify post appears on both Threads and Facebook

### Error Handling Testing
- [ ] Try posting without connecting accounts → expect clear error
- [ ] Try posting to Facebook without selecting pages → expect error
- [ ] Test with expired token (manually set expires_at in DB) → should auto-refresh
- [ ] Test posting with invalid image URL → expect error
- [ ] Disconnect account and try posting → expect error

### Token Refresh Testing
- [ ] Set expires_at to 5 days from now in database
- [ ] Verify dashboard shows "⚠️ Token expiring soon"
- [ ] Set expires_at to yesterday
- [ ] Try posting → should auto-refresh token
- [ ] Verify new expires_at in database (60 days from now)

---

## 🚀 Production Deployment

### Environment Variables (Vercel/Production)
```bash
NEXTAUTH_URL=https://www.inabiz.online
THREADS_APP_ID=<same_as_dev>
THREADS_APP_SECRET=<same_as_dev>
FACEBOOK_CLIENT_ID=<same_as_dev>
FACEBOOK_CLIENT_SECRET=<same_as_dev>
NEXTAUTH_SECRET=<same_as_dev>
DATABASE_URL=<production_postgres_url>
```

### OAuth Redirect URIs (Production)
Update both Facebook and Threads apps:
```
https://www.inabiz.online/api/auth/facebook/connect
https://www.inabiz.online/api/auth/threads/connect
```

### Deployment
```bash
git add .
git commit -m "Add dual OAuth system for Threads and Facebook Pages"
git push
```

### Post-Deployment Verification
- [ ] Test Threads connection on production
- [ ] Test Facebook Pages connection on production
- [ ] Test posting to both platforms on production
- [ ] Verify tokens stored in production database
- [ ] Check Vercel logs for any errors

---

## 📊 Database Verification

### Check Connections in Prisma Studio
```bash
npx prisma studio
```

**Expected Account records:**

For Threads:
```
provider: 'threads'
providerAccountId: <threads_user_id>
access_token: <long_token>
threadsUserId: <same_as_providerAccountId>
expires_at: <unix_timestamp>
```

For Facebook Pages:
```
provider: 'facebook-pages'
providerAccountId: <page_id>
pageId: <same_as_providerAccountId>
pageName: 'Page Name'
pageAccessToken: <page_token>
access_token: <user_token>
expires_at: <unix_timestamp>
```

---

## 🔍 Troubleshooting

### Issue: "Missing authorization code"
**Solution:** Check OAuth redirect URIs match exactly in app settings

### Issue: "Token exchange failed"
**Solution:** Verify App ID and App Secret are correct, check app is not restricted

### Issue: "No Facebook Pages found"
**Solution:** User must have admin access to at least one Facebook Page

### Issue: Component not showing
**Solution:** Make sure you imported and rendered ConnectionsManager/PostComposer

### Issue: TypeScript errors
**Solution:** Run `npm run build` to check for errors, ensure types are imported correctly

### Issue: "Unauthorized" when posting
**Solution:** User must be signed in, check session with `useSession()` hook

### Issue: Posts not appearing
**Solution:** Check console for API errors, verify tokens are valid, check platform rate limits

---

## 📈 Monitoring & Maintenance

### Regular Checks
- [ ] Monitor token expiry dates (warn users 7 days before)
- [ ] Check for API errors in logs
- [ ] Monitor posting success rates
- [ ] Review database for orphaned Account records

### Token Refresh Schedule
- Threads: Auto-refresh when < 24 hours to expiry
- Facebook Pages: Auto-refresh when < 24 hours to expiry
- Manual refresh available via "Reconnect" button

### Updates Required
- Facebook Graph API version (currently v18.0) - update yearly
- Threads API changes - monitor developer changelog
- Prisma version updates - test migrations carefully

---

## 🎯 Success Criteria

Your implementation is complete when:

✅ Users can connect Threads accounts  
✅ Users can connect multiple Facebook Pages  
✅ Connection status visible in dashboard  
✅ Token expiry warnings appear  
✅ Users can post to Threads only  
✅ Users can post to Facebook Pages only  
✅ Users can post to both simultaneously  
✅ Partial success handled gracefully  
✅ Tokens auto-refresh before expiry  
✅ Clear error messages for all failures  
✅ Disconnect functionality works  
✅ All TypeScript types are correct  
✅ No console errors in production  

---

## 📚 Reference Documentation

- **Main Guide:** `DUAL_OAUTH_GUIDE.md` - Complete technical documentation
- **Setup Guide:** `QUICK_SETUP.md` - Step-by-step setup instructions  
- **Summary:** `IMPLEMENTATION_SUMMARY.md` - Overview of all changes
- **This File:** `CHECKLIST.md` - Implementation checklist

---

**Last Updated:** December 2, 2025  
**Status:** Ready for setup and testing  
**Next Action:** Run database migration (`npx prisma migrate dev`)
