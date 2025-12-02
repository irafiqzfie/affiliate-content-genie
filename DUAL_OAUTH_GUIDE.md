# Dual OAuth System Documentation
## Threads + Facebook Pages Integration

This document describes the dual OAuth authentication system that allows users to connect both Threads and Facebook Pages to publish content from a single unified interface.

---

## 🎯 Overview

### Architecture
- **Independent OAuth flows**: Threads and Facebook Pages use separate OAuth providers
- **Unified token storage**: All tokens stored in Prisma `Account` table with provider-specific fields
- **Token refresh**: Automatic refresh for expiring tokens (60-day lifetime for both platforms)
- **Unified posting API**: Single `/api/post` endpoint handles posting to Threads, Facebook, or both
- **Security-first**: Server-side token storage, app-secret-proof for Facebook, session-based auth

### Key Features
✅ Connect/disconnect Threads and Facebook Pages independently  
✅ Store multiple Facebook Pages per user  
✅ Automatic token refresh before expiration  
✅ Post to one or multiple platforms simultaneously  
✅ Rich error messaging for connection/posting failures  
✅ Token expiry warnings in dashboard UI  

---

## 📊 Database Schema

### Extended Account Model
```prisma
model Account {
  id                String   @id @default(cuid())
  userId            String?
  provider          String   // 'threads', 'facebook', 'facebook-pages'
  providerAccountId String   // User ID from provider
  access_token      String?  @db.Text // Long-lived token
  refresh_token     String?  @db.Text
  expires_at        Int?     // Unix timestamp
  
  // Platform-specific fields
  pageId            String?  // Facebook Page ID
  pageName          String?  // Facebook Page Name
  pageAccessToken   String?  @db.Text // Page-specific token (60-day)
  threadsUserId     String?  // Threads user ID
  
  @@unique([provider, providerAccountId])
  @@index([userId, provider])
}
```

**Migration Required**: Run `npx prisma migrate dev` to apply schema changes.

---

## 🔐 Environment Variables

Add to `.env.local`:

```bash
# Threads OAuth
THREADS_APP_ID=your_threads_app_id
THREADS_APP_SECRET=your_threads_app_secret

# Facebook OAuth (for Pages)
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

---

## 🔄 OAuth Connection Flows

### 1. Threads Connection

**User initiates:**
```typescript
// POST /api/auth/threads/connect
// Returns: { authUrl: 'https://threads.net/oauth/authorize?...' }
```

**OAuth redirect URI:**
```
http://localhost:3000/api/auth/threads/connect
```

**Scopes requested:**
- `threads_basic` - Read user profile
- `threads_content_publish` - Publish threads

**Flow:**
1. User clicks "Connect Threads"
2. Redirected to Threads OAuth page
3. User authorizes app
4. Callback to `/api/auth/threads/connect`
5. Exchange code for long-lived token (60 days)
6. Store token in `Account` table
7. Redirect to dashboard with success message

**Code Example:**
```typescript
const connectThreads = async () => {
  const response = await fetch('/api/auth/threads/connect', {
    method: 'POST',
  });
  
  const { authUrl } = await response.json();
  window.location.href = authUrl; // Redirect to Threads
};
```

---

### 2. Facebook Pages Connection

**User initiates:**
```typescript
// POST /api/auth/facebook/connect
// Returns: { authUrl: 'https://www.facebook.com/v18.0/dialog/oauth?...' }
```

**OAuth redirect URI:**
```
http://localhost:3000/api/auth/facebook/connect
```

**Scopes requested:**
- `pages_show_list` - List user's pages
- `pages_read_engagement` - Read page insights
- `pages_manage_posts` - Publish to pages
- `business_management` - Manage business assets

**Flow:**
1. User clicks "Connect Facebook Pages"
2. Redirected to Facebook OAuth dialog
3. User selects which pages to grant access
4. Callback to `/api/auth/facebook/connect`
5. Exchange code for user token
6. Exchange user token for long-lived token (60 days)
7. Fetch user's pages using `/me/accounts`
8. Store each page as separate `Account` record with page-specific token
9. Redirect to dashboard

**Code Example:**
```typescript
const connectFacebook = async () => {
  const response = await fetch('/api/auth/facebook/connect', {
    method: 'POST',
  });
  
  const { authUrl } = await response.json();
  window.location.href = authUrl; // Redirect to Facebook
};
```

---

## 📝 Posting API

### Unified POST /api/post

**Request:**
```typescript
POST /api/post
Content-Type: application/json

{
  "platforms": ["threads", "facebook"], // or ["threads"] or ["facebook"]
  "content": {
    "text": "Check out this amazing product! 🔥",
    "imageUrl": "https://example.com/image.jpg" // optional
  },
  "facebookPageIds": ["123456789"] // required if posting to Facebook
}
```

**Response (success):**
```json
{
  "success": true,
  "partial": false,
  "results": [
    {
      "platform": "threads",
      "success": true,
      "postId": "18123456789"
    },
    {
      "platform": "facebook",
      "success": true,
      "postId": "123456789_987654321",
      "pageId": "123456789",
      "pageName": "My Business Page"
    }
  ]
}
```

**Response (partial success):**
```json
{
  "success": false,
  "partial": true,
  "results": [
    {
      "platform": "threads",
      "success": true,
      "postId": "18123456789"
    },
    {
      "platform": "facebook",
      "success": false,
      "error": "Facebook token expired and refresh failed. Please reconnect your page.",
      "pageId": "123456789",
      "pageName": "My Business Page"
    }
  ]
}
```

**Response (all failed):**
```json
{
  "success": false,
  "partial": false,
  "results": [
    {
      "platform": "threads",
      "success": false,
      "error": "Threads account not connected. Please connect your Threads account first."
    },
    {
      "platform": "facebook",
      "success": false,
      "error": "No Facebook Pages selected. Please select at least one page."
    }
  ]
}
```

**Usage Example:**
```typescript
const publishPost = async () => {
  const response = await fetch('/api/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      platforms: ['threads', 'facebook'],
      content: {
        text: 'My post content',
        imageUrl: 'https://example.com/image.jpg',
      },
      facebookPageIds: ['123456789', '987654321'], // Post to 2 pages
    }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    alert('Posted successfully to all platforms!');
  } else if (result.partial) {
    alert('Posted to some platforms. Check results for details.');
  } else {
    alert('Failed to post. Check errors.');
  }
};
```

---

## 🔄 Token Refresh

### Threads Token Refresh

Threads tokens last **60 days** and can be refreshed.

```typescript
import { refreshThreadsToken } from '@/lib/oauth-helpers';

const token = await refreshThreadsToken(userId);
if (!token) {
  // Refresh failed, user needs to reconnect
}
```

**API Endpoint:**
```
GET https://graph.threads.net/oauth/access_token?
  grant_type=th_refresh_token&
  access_token={current_token}
```

**Refresh Logic:**
- Automatically triggered when posting if token expires within 24 hours
- Returns new 60-day token
- Updates `Account` record with new token and expiry

---

### Facebook Page Token Refresh

Facebook Page tokens last **60 days** and can be extended.

```typescript
import { refreshFacebookPageToken } from '@/lib/oauth-helpers';

const token = await refreshFacebookPageToken(userId, pageId);
if (!token) {
  // Refresh failed, user needs to reconnect
}
```

**API Endpoint:**
```
GET https://graph.facebook.com/v18.0/oauth/access_token?
  grant_type=fb_exchange_token&
  client_id={app_id}&
  client_secret={app_secret}&
  fb_exchange_token={current_page_token}
```

**Refresh Logic:**
- Automatically triggered when posting if token expires within 24 hours
- Returns new 60-day token
- Updates `Account` record with new token and expiry

---

## 🔒 Security

### App Secret Proof (Facebook)

All Facebook API calls include `appsecret_proof` for additional security.

```typescript
import { generateAppSecretProof } from '@/lib/oauth-helpers';

const proof = generateAppSecretProof(pageAccessToken);

// Use in API call
const params = new URLSearchParams({
  access_token: pageAccessToken,
  appsecret_proof: proof,
  message: 'Post content',
});
```

**Implementation:**
```typescript
export function generateAppSecretProof(accessToken: string): string {
  const appSecret = process.env.FACEBOOK_CLIENT_SECRET || '';
  return crypto.createHmac('sha256', appSecret)
    .update(accessToken)
    .digest('hex');
}
```

### Server-Side Only

🔒 **Critical Security Rules:**
- ✅ All tokens stored server-side in database
- ✅ Never expose tokens to frontend
- ✅ All API calls use `getServerSession()` to verify auth
- ✅ Tokens scoped to user via `userId` in database
- ✅ App secret proof on all Facebook API calls

---

## 🎨 Dashboard UI

### ConnectionsManager Component

```tsx
import ConnectionsManager from '@/app/components/ConnectionsManager';

export default function Dashboard() {
  return (
    <div>
      <h1>My Dashboard</h1>
      <ConnectionsManager />
    </div>
  );
}
```

**Features:**
- Visual cards for Threads and Facebook Pages
- Connection status badges (Connected / Not Connected)
- Token expiry warnings (⚠️ if < 7 days until expiry)
- Connect/Reconnect buttons
- List of connected Facebook Pages with individual disconnect buttons
- Real-time status updates

---

## 🧪 Testing

### 1. Test Threads Connection

1. Navigate to dashboard
2. Click "Connect Threads"
3. Authorize on Threads OAuth page
4. Verify redirect back to dashboard with success message
5. Check database: `Account` record with `provider='threads'`

### 2. Test Facebook Pages Connection

1. Navigate to dashboard
2. Click "Connect Facebook Pages"
3. Authorize on Facebook OAuth dialog
4. Select which pages to connect
5. Verify redirect back to dashboard
6. Check database: Multiple `Account` records with `provider='facebook-pages'`

### 3. Test Unified Posting

```bash
curl -X POST http://localhost:3000/api/post \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN" \
  -d '{
    "platforms": ["threads", "facebook"],
    "content": {
      "text": "Test post from API",
      "imageUrl": "https://example.com/test.jpg"
    },
    "facebookPageIds": ["123456789"]
  }'
```

### 4. Test Token Refresh

1. Manually set `expires_at` to past timestamp in database
2. Attempt to post
3. Verify automatic token refresh
4. Check logs for refresh attempt

---

## 📋 API Reference

### GET /api/auth/connections
Returns all connected accounts for current user.

**Response:**
```json
{
  "threads": {
    "id": "...",
    "provider": "threads",
    "threadsUserId": "123456",
    "expires_at": 1234567890
  },
  "facebook": [
    {
      "id": "...",
      "provider": "facebook-pages",
      "pageId": "123456789",
      "pageName": "My Page",
      "expires_at": 1234567890
    }
  ]
}
```

### POST /api/auth/disconnect
Disconnects a provider.

**Request:**
```json
{
  "provider": "threads", // or "facebook-pages"
  "accountId": "optional_specific_account_id"
}
```

### POST /api/auth/threads/connect
Initiates Threads OAuth flow.

**Response:**
```json
{
  "authUrl": "https://threads.net/oauth/authorize?..."
}
```

### POST /api/auth/facebook/connect
Initiates Facebook Pages OAuth flow.

**Response:**
```json
{
  "authUrl": "https://www.facebook.com/v18.0/dialog/oauth?..."
}
```

---

## 🚨 Error Handling

### Common Errors

**Threads not connected:**
```json
{
  "platform": "threads",
  "success": false,
  "error": "Threads account not connected. Please connect your Threads account first."
}
```

**Token expired:**
```json
{
  "platform": "threads",
  "success": false,
  "error": "Threads token expired and refresh failed. Please reconnect your account."
}
```

**No Facebook Pages selected:**
```json
{
  "platform": "facebook",
  "success": false,
  "error": "No Facebook Pages selected. Please select at least one page."
}
```

**Facebook API error:**
```json
{
  "platform": "facebook",
  "success": false,
  "error": "Invalid OAuth access token",
  "pageId": "123456789",
  "pageName": "My Page"
}
```

---

## 🔗 Facebook App Configuration

### Required Settings

1. **App Domains:**
   - `localhost` (for development)
   - `yourdomain.com` (for production)

2. **Valid OAuth Redirect URIs:**
   - `http://localhost:3000/api/auth/facebook/connect` (dev)
   - `https://yourdomain.com/api/auth/facebook/connect` (prod)

3. **Permissions Required:**
   - `pages_show_list`
   - `pages_read_engagement`
   - `pages_manage_posts`
   - `business_management`

4. **App Review:**
   - Submit for review if app is in Development mode
   - Or add test users in App Roles > Test Users

---

## 🔗 Threads App Configuration

### Required Settings

1. **Redirect URIs:**
   - `http://localhost:3000/api/auth/threads/connect` (dev)
   - `https://yourdomain.com/api/auth/threads/connect` (prod)

2. **Permissions:**
   - `threads_basic`
   - `threads_content_publish`

3. **App Mode:**
   - Development mode allows test users only
   - Live mode requires business verification

---

## 📚 Additional Resources

- [Threads API Documentation](https://developers.facebook.com/docs/threads)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs/)

---

## ✅ Implementation Checklist

- [x] Update Prisma schema with platform-specific fields
- [x] Create OAuth connection routes (Threads + Facebook)
- [x] Implement token storage helpers
- [x] Build token refresh logic
- [x] Create unified `/api/post` endpoint
- [x] Build `ConnectionsManager` UI component
- [x] Add app secret proof security
- [x] Create comprehensive documentation
- [ ] Run database migration
- [ ] Add environment variables
- [ ] Configure Facebook App settings
- [ ] Configure Threads App settings
- [ ] Test OAuth flows
- [ ] Test posting to both platforms

---

**Last Updated:** December 2, 2025
