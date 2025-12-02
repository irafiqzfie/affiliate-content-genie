# Quick Setup Guide - Dual OAuth System

## 🚀 Getting Started

This guide will help you set up the Threads + Facebook Pages OAuth integration in 10 minutes.

---

## Step 1: Database Migration

Run the Prisma migration to update your database schema:

```bash
npx prisma migrate dev --name add_oauth_fields
```

This adds the platform-specific fields to the `Account` table.

---

## Step 2: Environment Variables

Add these to your `.env.local`:

```bash
# Threads OAuth
THREADS_APP_ID=your_threads_app_id_here
THREADS_APP_SECRET=your_threads_app_secret_here

# Facebook OAuth (already configured)
FACEBOOK_CLIENT_ID=1340853470991732
FACEBOOK_CLIENT_SECRET=your_facebook_secret_here

# NextAuth (already configured)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

**Get Threads credentials:**
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or select your app
3. Add "Threads" product
4. Copy App ID and App Secret

---

## Step 3: Configure Facebook App

### OAuth Redirect URIs

Add to **Facebook Login Settings**:
```
http://localhost:3000/api/auth/facebook/connect
https://www.inabiz.online/api/auth/facebook/connect
```

### App Domains
```
localhost
www.inabiz.online
inabiz.online
```

### Required Permissions

Request these permissions in App Review:
- ✅ `pages_show_list`
- ✅ `pages_read_engagement`
- ✅ `pages_manage_posts`
- ✅ `business_management`

---

## Step 4: Configure Threads App

### OAuth Redirect URIs

Add to **Threads Settings**:
```
http://localhost:3000/api/auth/threads/connect
https://www.inabiz.online/api/auth/threads/connect
```

### Required Permissions
- ✅ `threads_basic`
- ✅ `threads_content_publish`

---

## Step 5: Add UI to Your App

**Option A: Add to existing dashboard**

```tsx
// src/app/dashboard/page.tsx
import ConnectionsManager from '@/app/components/ConnectionsManager';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <ConnectionsManager />
      {/* Your existing dashboard content */}
    </div>
  );
}
```

**Option B: Create dedicated connections page**

```tsx
// src/app/connections/page.tsx
import ConnectionsManager from '@/app/components/ConnectionsManager';

export default function ConnectionsPage() {
  return <ConnectionsManager />;
}
```

---

## Step 6: Test the Integration

### 6.1 Start Dev Server

```bash
npm run dev
```

### 6.2 Connect Threads

1. Navigate to your dashboard
2. Click "Connect Threads"
3. Authorize on Threads
4. Verify you're redirected back with success

### 6.3 Connect Facebook Pages

1. Click "Connect Facebook Pages"
2. Select which pages to connect
3. Authorize
4. Verify pages appear in dashboard

### 6.4 Test Posting

```typescript
// Example: Post to both platforms
const response = await fetch('/api/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platforms: ['threads', 'facebook'],
    content: {
      text: 'Test post! 🚀',
      imageUrl: 'https://example.com/image.jpg',
    },
    facebookPageIds: ['your_page_id'],
  }),
});

const result = await response.json();
console.log(result);
```

---

## Step 7: Deploy to Production

### Update Environment Variables in Vercel

```bash
# Production URLs
NEXTAUTH_URL=https://www.inabiz.online
THREADS_APP_ID=same_as_dev
THREADS_APP_SECRET=same_as_dev
FACEBOOK_CLIENT_ID=same_as_dev
FACEBOOK_CLIENT_SECRET=same_as_dev
```

### Update OAuth Redirect URIs

Both Facebook and Threads apps need production redirect URIs:
```
https://www.inabiz.online/api/auth/facebook/connect
https://www.inabiz.online/api/auth/threads/connect
```

### Deploy

```bash
git add .
git commit -m "Add dual OAuth system"
git push
```

---

## 🎯 Quick Test Checklist

- [ ] Database migration applied
- [ ] Environment variables set
- [ ] Facebook App configured (redirect URIs, permissions)
- [ ] Threads App configured (redirect URIs)
- [ ] ConnectionsManager component added to UI
- [ ] Threads connection works
- [ ] Facebook Pages connection works
- [ ] Posting to Threads works
- [ ] Posting to Facebook works
- [ ] Posting to both simultaneously works
- [ ] Token expiry warnings appear in dashboard
- [ ] Disconnect functionality works

---

## 🔧 Troubleshooting

### "Missing authorization code"
- Check redirect URIs match exactly in app settings
- Ensure NEXTAUTH_URL is set correctly

### "Token exchange failed"
- Verify App ID and App Secret are correct
- Check app is not in restricted mode

### "No Facebook Pages found"
- User must have admin access to at least one Facebook Page
- Create a test page if needed

### "Threads account not connected"
- User must connect Threads first via ConnectionsManager
- Check Account table has record with provider='threads'

### Token refresh fails
- Long-lived tokens expire after 60 days
- User needs to reconnect after expiry
- Check console logs for refresh errors

---

## 📞 Need Help?

See the full documentation: `DUAL_OAUTH_GUIDE.md`

---

**Last Updated:** December 2, 2025
