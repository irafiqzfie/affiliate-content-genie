# Dual OAuth System Architecture

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐        ┌──────────────────────┐          │
│  │  ConnectionsManager  │        │    PostComposer      │          │
│  │                      │        │                      │          │
│  │  - Threads Status    │        │  - Platform Select   │          │
│  │  - Facebook Pages    │        │  - Content Input     │          │
│  │  - Connect/Reconnect │        │  - Multi-Platform    │          │
│  │  - Disconnect        │        │    Publishing        │          │
│  └──────────────────────┘        └──────────────────────┘          │
│           │                                    │                     │
└───────────┼────────────────────────────────────┼─────────────────────┘
            │                                    │
            ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API LAYER                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │ /api/auth/     │  │ /api/auth/     │  │   /api/post    │        │
│  │ connections    │  │ disconnect     │  │                │        │
│  │                │  │                │  │ - Threads      │        │
│  │ - Get Status   │  │ - Remove Link  │  │ - Facebook     │        │
│  └────────────────┘  └────────────────┘  │ - Both         │        │
│                                           │ - Auto Refresh │        │
│  ┌────────────────┐  ┌────────────────┐  └────────────────┘        │
│  │ /api/auth/     │  │ /api/auth/     │                             │
│  │ threads/       │  │ facebook/      │                             │
│  │ connect        │  │ connect        │                             │
│  │                │  │                │                             │
│  │ - OAuth Flow   │  │ - OAuth Flow   │                             │
│  │ - Token Store  │  │ - Pages Fetch  │                             │
│  └────────────────┘  └────────────────┘                             │
│           │                     │                                    │
└───────────┼─────────────────────┼────────────────────────────────────┘
            │                     │
            ▼                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      OAUTH HELPERS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Token Storage    │  │ Token Refresh    │  │ Security Utils   │  │
│  │                  │  │                  │  │                  │  │
│  │ - storeOAuth     │  │ - refreshThreads │  │ - appSecretProof │  │
│  │ - getOAuth       │  │ - refreshFB      │  │ - isExpired      │  │
│  │ - getConnections │  │ - autoRefresh    │  │                  │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
│           │                     │                      │             │
└───────────┼─────────────────────┼──────────────────────┼─────────────┘
            │                     │                      │
            ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE (Prisma)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                      Account Table                            │   │
│  ├──────────────────────────────────────────────────────────────┤   │
│  │ id, userId, provider, providerAccountId                      │   │
│  │ access_token, refresh_token, expires_at                      │   │
│  │                                                               │   │
│  │ Platform-Specific Fields:                                    │   │
│  │ - pageId, pageName, pageAccessToken (Facebook)               │   │
│  │ - threadsUserId (Threads)                                    │   │
│  │ - instagramId (Instagram)                                    │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                       │
└───────────┬─────────────────────┬──────────────────────┬─────────────┘
            │                     │                      │
            ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL OAUTH PROVIDERS                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐           ┌──────────────────┐                │
│  │  Threads OAuth   │           │  Facebook OAuth  │                │
│  │                  │           │                  │                │
│  │ - Authorize      │           │ - Authorize      │                │
│  │ - Token Exchange │           │ - Token Exchange │                │
│  │ - Token Refresh  │           │ - Pages API      │                │
│  │ - 60-day tokens  │           │ - 60-day tokens  │                │
│  └──────────────────┘           └──────────────────┘                │
│           │                              │                           │
└───────────┼──────────────────────────────┼───────────────────────────┘
            │                              │
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SOCIAL MEDIA PLATFORMS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────┐           ┌──────────────────┐                │
│  │  Threads API     │           │  Facebook Graph  │                │
│  │                  │           │      API         │                │
│  │ - Post Creation  │           │ - Page Posts     │                │
│  │ - Media Upload   │           │ - Photo Posts    │                │
│  │ - Container Pub  │           │ - Feed Posts     │                │
│  └──────────────────┘           └──────────────────┘                │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 OAuth Connection Flow

### Threads Connection Flow

```
User → Click "Connect Threads"
  ↓
POST /api/auth/threads/connect
  ↓
Returns authUrl → Redirect to Threads OAuth
  ↓
User Authorizes App
  ↓
Redirect to GET /api/auth/threads/connect?code=xxx
  ↓
Exchange code for long-lived token (60 days)
  ↓
Fetch user profile (id, username, name, picture)
  ↓
Store in Account table:
  - provider: 'threads'
  - providerAccountId: <threads_user_id>
  - access_token: <long_lived_token>
  - threadsUserId: <threads_user_id>
  - expires_at: <unix_timestamp>
  ↓
Redirect to dashboard with success=threads_connected
  ↓
ConnectionsManager shows "Connected" status
```

### Facebook Pages Connection Flow

```
User → Click "Connect Facebook Pages"
  ↓
POST /api/auth/facebook/connect
  ↓
Returns authUrl → Redirect to Facebook OAuth
  ↓
User Selects Pages & Authorizes
  ↓
Redirect to GET /api/auth/facebook/connect?code=xxx
  ↓
Exchange code for short-lived user token
  ↓
Exchange for long-lived user token (60 days)
  ↓
Fetch user's pages via /me/accounts
  ↓
For each page, store in Account table:
  - provider: 'facebook-pages'
  - providerAccountId: <page_id>
  - access_token: <user_long_lived_token>
  - pageAccessToken: <page_long_lived_token>
  - pageId: <page_id>
  - pageName: <page_name>
  - expires_at: <unix_timestamp>
  ↓
Redirect to dashboard with success=facebook_connected
  ↓
ConnectionsManager shows connected pages list
```

---

## 📝 Posting Flow

### Unified Post Endpoint

```
User fills PostComposer
  ↓
Selects platforms: ['threads', 'facebook']
  ↓
Selects Facebook Pages: ['page_123', 'page_456']
  ↓
Enters content: { text, imageUrl }
  ↓
POST /api/post {
  platforms: ['threads', 'facebook'],
  content: { text, imageUrl },
  facebookPageIds: ['page_123', 'page_456']
}
  ↓
Server validates session (getServerSession)
  ↓
FOR EACH PLATFORM:
  ├─ Get account from database
  ├─ Check token expiry
  ├─ Auto-refresh if needed
  ├─ Post to platform API
  └─ Collect result
  ↓
Return results: {
  success: boolean,
  partial: boolean,
  results: [
    { platform: 'threads', success: true, postId: '123' },
    { platform: 'facebook', success: true, postId: '456', pageName: 'Page 1' },
    { platform: 'facebook', success: false, error: 'Token expired', pageName: 'Page 2' }
  ]
}
  ↓
UI displays results with success/error indicators
```

---

## 🔒 Security Flow

### Token Storage & Protection

```
OAuth Callback
  ↓
Receive access_token from provider
  ↓
NEVER send to frontend
  ↓
Store in database (server-side only)
  ↓
Link to userId (session-scoped)
  ↓
For Facebook API calls:
  ├─ Generate app_secret_proof
  ├─ HMAC-SHA256(access_token, app_secret)
  └─ Include in every request
  ↓
Frontend only sees:
  - Connection status (connected/not connected)
  - Expiry warnings
  - Post results
  ↓
All API endpoints protected:
  - getServerSession() check
  - userId scoping on queries
  - Token never exposed in response
```

---

## 🔄 Token Refresh Flow

### Automatic Refresh (60-day tokens)

```
User attempts to post
  ↓
API fetches account from database
  ↓
Check expires_at timestamp
  ↓
If expires_at < (now + 24 hours):
  ├─ Call refresh API
  │   ├─ Threads: GET /oauth/access_token?grant_type=th_refresh_token
  │   └─ Facebook: GET /oauth/access_token?grant_type=fb_exchange_token
  ├─ Receive new long-lived token (60 days)
  ├─ Update database:
  │   ├─ access_token = new_token
  │   └─ expires_at = now + 60 days
  └─ Continue with post
  ↓
If refresh fails:
  ├─ Return error to user
  └─ Show "Reconnect" button in UI
```

---

## 📊 Database Schema

### Account Table Structure

```
Account {
  id                String   @id
  userId            String   (FK to User)
  
  // Provider info
  provider          String   ('threads' | 'facebook-pages')
  providerAccountId String   (Threads user ID or FB page ID)
  
  // Universal tokens
  access_token      String   @db.Text
  refresh_token     String?  @db.Text
  expires_at        Int?     (Unix timestamp)
  
  // Facebook-specific
  pageId            String?  (Facebook Page ID)
  pageName          String?  (Facebook Page name)
  pageAccessToken   String?  @db.Text
  
  // Threads-specific
  threadsUserId     String?  (Threads user ID)
  
  // Future: Instagram
  instagramId       String?
  
  @@unique([provider, providerAccountId])
  @@index([userId, provider])
}
```

### Example Records

**Threads Account:**
```json
{
  "id": "acc_abc123",
  "userId": "user_xyz",
  "provider": "threads",
  "providerAccountId": "18123456789",
  "access_token": "IGQWRP...long_token",
  "threadsUserId": "18123456789",
  "expires_at": 1736035200
}
```

**Facebook Page Account:**
```json
{
  "id": "acc_def456",
  "userId": "user_xyz",
  "provider": "facebook-pages",
  "providerAccountId": "123456789",
  "access_token": "EAAG...user_long_token",
  "pageAccessToken": "EAAG...page_long_token",
  "pageId": "123456789",
  "pageName": "My Business Page",
  "expires_at": 1736035200
}
```

---

## 🎯 Component Hierarchy

```
App
├── Layout (SessionProvider)
│
├── Dashboard Page
│   ├── ConnectionsManager
│   │   ├── Threads Card
│   │   │   ├── Status Badge
│   │   │   ├── Connection Info
│   │   │   └── Connect/Disconnect Buttons
│   │   │
│   │   └── Facebook Pages Card
│   │       ├── Status Badge
│   │       ├── Pages List
│   │       │   └── Page Items (with Remove buttons)
│   │       └── Connect/Add More Buttons
│   │
│   └── PostComposer
│       ├── Content Input (text + image)
│       ├── Platform Selector (Threads + Facebook checkboxes)
│       ├── Page Selector (if Facebook selected)
│       ├── Publish Button
│       └── Results Display
│           └── Per-platform success/error messages
│
└── API Routes
    ├── /api/auth/threads/connect (POST + GET)
    ├── /api/auth/facebook/connect (POST + GET)
    ├── /api/auth/connections (GET)
    ├── /api/auth/disconnect (POST)
    └── /api/post (POST)
```

---

**Last Updated:** December 2, 2025  
**Version:** 1.0.0
