# Threads API Integration Guide

This guide explains how the Threads API integration works in Affiliate Content Genie.

## Overview

Threads (by Meta/Instagram) is a text-based conversation app. We've integrated it to allow users to:
- Sign in with their Threads account
- Post generated affiliate content directly to Threads
- Schedule posts for later publishing

## Setup Requirements

### 1. Threads App Configuration

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create or select your app
3. Add "Threads" as a product
4. Configure OAuth settings:
   - **Valid OAuth Redirect URIs**: `https://yourdomain.com/api/auth/callback/threads`
   - For local development: `http://localhost:3000/api/auth/callback/threads`

### 2. Required Permissions

The app requests these Threads API permissions:
- `threads_basic` - Access to basic profile information (username, name, profile picture)
- `threads_content_publish` - Ability to publish content on behalf of the user

### 3. Environment Variables

Add to your `.env.local`:

```bash
THREADS_APP_ID=your_threads_app_id
THREADS_APP_SECRET=your_threads_app_secret
```

## How It Works

### Authentication Flow

1. User clicks "Sign in with Threads" button
2. User is redirected to Threads OAuth authorization page
3. User grants permissions
4. Threads redirects back with authorization code
5. NextAuth exchanges code for access token
6. Access token is stored in database (Account model)

### Posting to Threads

The Threads API uses a two-step process:

#### Step 1: Create Container
```typescript
POST https://graph.threads.net/v1.0/{user_id}/threads
{
  "media_type": "TEXT" | "IMAGE" | "VIDEO",
  "text": "Post caption",
  "image_url": "https://...", // Optional
  "access_token": "user_access_token"
}
// Returns: { "id": "container_id" }
```

#### Step 2: Publish Container
```typescript
POST https://graph.threads.net/v1.0/{user_id}/threads_publish
{
  "creation_id": "container_id",
  "access_token": "user_access_token"
}
// Returns: { "id": "thread_id" }
```

## API Routes

### POST /api/threads/post

Posts content to Threads.

**Request Body:**
```json
{
  "text": "Post caption (required)",
  "mediaUrl": "https://image-url.com/image.jpg (optional)",
  "mediaType": "IMAGE" | "VIDEO" (default: IMAGE)"
}
```

**Response:**
```json
{
  "success": true,
  "postId": "thread_id",
  "message": "Successfully posted to Threads!"
}
```

**Error Responses:**
- `401`: User not authenticated
- `403`: Threads account not connected
- `400`: Missing required fields
- `500`: API error

### GET /api/threads/post

Check Threads connection status and get profile info.

**Response:**
```json
{
  "connected": true,
  "profile": {
    "id": "user_id",
    "username": "username",
    "name": "Display Name",
    "threads_profile_picture_url": "https://..."
  }
}
```

## UI Components

### ThreadsConsentModal

Modal that explains permissions and initiates OAuth flow.

**Usage:**
```tsx
import ThreadsConsentModal from './ThreadsConsentModal'

<ThreadsConsentModal 
  isOpen={showModal}
  onClose={() => setShowModal(false)}
/>
```

### AuthButton

Updated to support both Facebook and Threads sign-in.

**Features:**
- Shows separate buttons for Facebook and Threads
- Displays user info when signed in
- Handles sign out for both providers

## Database Schema

The existing Prisma `Account` model stores Threads tokens:

```prisma
model Account {
  id                String   @id @default(cuid())
  userId            String?
  provider          String   // "threads"
  providerAccountId String   // Threads user ID
  access_token      String?  // OAuth access token
  refresh_token     String?  // Not provided by Threads
  expires_at        Int?     // Token expiration
  // ... other fields
}
```

## Scheduling Posts

Scheduled posts are stored with platform information:

```prisma
model ScheduledPost {
  id            Int      @id @default(autoincrement())
  userId        String?
  platform      String   // "Facebook" | "Threads"
  scheduledTime DateTime
  imageUrl      String
  caption       String
  status        String   // "Scheduled"
  // ... other fields
}
```

## Content Limits

Threads has specific content limits:
- **Text posts**: Up to 500 characters
- **Image posts**: 1 image + caption
- **Video posts**: Up to 5 minutes, max 1GB

## Error Handling

Common errors and solutions:

### "Threads account not connected"
- User needs to sign in with Threads
- Access token may have expired
- Solution: Reconnect Threads account

### "Failed to create container"
- Media URL may be invalid or inaccessible
- Text exceeds character limit
- Solution: Validate inputs before posting

### "Failed to publish"
- Container creation succeeded but publish failed
- May need to retry
- Solution: Implement retry logic

## Testing

### Local Development
1. Use ngrok or similar tool to expose localhost
2. Update OAuth redirect URIs in Meta Developer Console
3. Test authentication flow
4. Test posting with sample content

### Production
1. Ensure redirect URIs match production domain
2. Test with real user accounts
3. Monitor API rate limits
4. Set up error tracking

## Rate Limits

Threads API rate limits (as of 2024):
- **Read requests**: 200/hour per user
- **Write requests** (posts): 50/day per user
- **App-level**: Varies based on app usage

## Best Practices

1. **Token Management**
   - Store tokens securely in database
   - Check token expiration before posting
   - Handle token refresh (if supported)

2. **Error Messages**
   - Provide clear feedback to users
   - Log errors for debugging
   - Implement retry logic for transient failures

3. **Content Validation**
   - Validate text length before posting
   - Check media URLs are accessible
   - Preview content before publishing

4. **User Experience**
   - Show connection status clearly
   - Allow users to disconnect easily
   - Provide post confirmation feedback

## Future Enhancements

Potential improvements:
- **Analytics**: Track post performance
- **Bulk posting**: Post to multiple platforms at once
- **Draft management**: Save drafts before posting
- **Reply management**: Handle comments and engagement
- **Media library**: Manage uploaded media

## Troubleshooting

### OAuth Errors

**"redirect_uri_mismatch"**
- Ensure redirect URI in app matches exactly
- Check for http vs https
- Verify trailing slashes

**"access_denied"**
- User denied permissions
- App not approved for permissions
- Check app status in Meta Developer Console

### API Errors

**403 Forbidden**
- Check permissions granted
- Verify access token is valid
- Ensure user hasn't revoked access

**400 Bad Request**
- Validate request body format
- Check required fields are present
- Verify media URLs are valid

## Resources

- [Threads API Documentation](https://developers.facebook.com/docs/threads)
- [Meta OAuth Documentation](https://developers.facebook.com/docs/facebook-login)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Documentation](https://www.prisma.io/docs)

## Support

For issues or questions:
- Check error logs in browser console
- Review server logs for API errors
- Contact Meta Developer Support for API-specific issues
- Email: admin@inabiz.online
