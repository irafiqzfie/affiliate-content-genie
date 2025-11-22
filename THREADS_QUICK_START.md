# Threads Integration - Quick Start Guide

## ✅ What's Been Added

The Threads API integration is now complete! Here's what's been implemented:

### 🔐 Authentication
- **Threads OAuth Provider**: Sign in with Threads account
- **ThreadsConsentModal**: User-friendly consent dialog explaining permissions
- **Dual Sign-in**: Support for both Facebook and Threads authentication

### 📤 API Endpoints
- `POST /api/threads/post` - Post content (text + optional image/video) to Threads
- `GET /api/threads/post` - Check connection status and get profile info

### 🎨 UI Components
- Updated `AuthButton` with Threads sign-in option
- New `ThreadsConsentModal` component
- Threads scheduling already integrated in existing scheduler UI

### 📝 Documentation
- Updated `README.md` with environment setup
- New `THREADS_INTEGRATION.md` with complete technical guide

## 🚀 Getting Started

### 1. Environment Variables

Add these to your `.env.local`:

```bash
THREADS_APP_ID=1303297011016524
THREADS_APP_SECRET=3c3d66bd156fe1ddbbbb722daaf62c5d
```

✅ Already added!

### 2. Meta Developer Configuration

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select/create your app
3. Add "Threads" as a product
4. Configure OAuth redirect URIs:
   - Production: `https://yourdomain.com/api/auth/callback/threads`
   - Local: `http://localhost:3000/api/auth/callback/threads`
5. Enable permissions:
   - `threads_basic` (profile info)
   - `threads_content_publish` (posting)

### 3. Test the Integration

#### Sign In with Threads
```
1. Click "🧵 Threads" button in header
2. Review and accept permissions
3. Authorize with Threads
4. You're connected!
```

#### Post to Threads
```
1. Generate or select content
2. Click "🗓️ Schedule" button
3. Choose "Schedule on Threads"
4. Select date/time
5. Confirm scheduling
```

#### Direct Posting (API)
```bash
POST /api/threads/post
{
  "text": "Check out this amazing product!",
  "mediaUrl": "https://example.com/image.jpg",
  "mediaType": "IMAGE"
}
```

## 🎯 Key Features

### Two-Step Posting Flow
Threads API requires a container-based approach:
1. **Create Container**: Prepare the post (text + media)
2. **Publish Container**: Make it live on Threads

### Supported Content Types
- ✅ Text-only posts (up to 500 characters)
- ✅ Image + text posts
- ✅ Video + text posts (up to 5 min, 1GB max)

### Content Scheduling
- Schedule posts for Facebook or Threads
- View all scheduled posts in scheduler tab
- Cancel scheduled posts anytime

## 🔒 Security & Privacy

### What We Access
- ✅ Basic profile (username, name, profile picture)
- ✅ Post publishing capability

### What We DON'T Access
- ❌ Private messages
- ❌ Followers/following lists
- ❌ Analytics/insights
- ❌ Other users' content

### Token Storage
- Access tokens stored securely in Prisma database
- Encrypted in transit (HTTPS)
- User can revoke access anytime

## 📊 Database Schema

Threads data is stored in existing tables:

### Account Table
```prisma
model Account {
  provider          String   // "threads"
  providerAccountId String   // Threads user ID
  access_token      String?  // OAuth token
  // ... existing fields
}
```

### ScheduledPost Table
```prisma
model ScheduledPost {
  platform      String   // "Threads" | "Facebook"
  scheduledTime DateTime
  caption       String
  imageUrl      String
  // ... existing fields
}
```

## 🛠️ API Usage Examples

### Check Connection Status
```typescript
const response = await fetch('/api/threads/post');
const data = await response.json();

if (data.connected) {
  console.log('Username:', data.profile.username);
}
```

### Post Content
```typescript
const response = await fetch('/api/threads/post', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Your post caption',
    mediaUrl: 'https://image-url.jpg',
    mediaType: 'IMAGE'
  })
});

const result = await response.json();
console.log('Post ID:', result.postId);
```

## ⚠️ Important Notes

### Rate Limits
- **Posts**: 50 per day per user
- **API calls**: 200 per hour per user

### Content Guidelines
- Text: Max 500 characters
- Videos: Max 5 minutes, 1GB
- Images: Standard web formats (JPG, PNG)

### Testing
1. Use localhost or ngrok for local testing
2. Update OAuth redirect URIs accordingly
3. Test with your personal Threads account first

## 🐛 Troubleshooting

### "Threads account not connected"
→ User needs to sign in with Threads first

### "Failed to create container"
→ Check media URL is accessible and text length is valid

### "OAuth redirect_uri_mismatch"
→ Ensure redirect URI in Meta console matches exactly

### "Access denied"
→ User denied permissions or app not approved

## 📚 Additional Resources

- [THREADS_INTEGRATION.md](./THREADS_INTEGRATION.md) - Full technical documentation
- [Meta Threads API Docs](https://developers.facebook.com/docs/threads)
- [NextAuth.js Docs](https://next-auth.js.org/)

## ✨ What's Next?

Potential enhancements:
- [ ] Analytics integration
- [ ] Bulk posting to multiple platforms
- [ ] Reply/comment management
- [ ] Media library for uploads
- [ ] Post templates

## 📞 Support

Questions or issues?
- 📧 Email: admin@inabiz.online
- 📱 Phone: 014-514 3981
- 🐛 GitHub Issues: [Create an issue](https://github.com/irafiqzfie/affiliate-content-genie/issues)

---

**Status**: ✅ Ready for production
**Last Updated**: November 18, 2025
**Version**: 1.0.0
