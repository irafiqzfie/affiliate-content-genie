# Facebook & Threads OAuth Setup Guide

## Error: URL Blocked (1349168)

This error occurs when the OAuth redirect URI is not whitelisted in your Meta App settings.

## Solution Steps for Threads

### 1. Meta Developer Dashboard Configuration

1. Go to https://developers.facebook.com/apps
2. Select your app **"Inabiz Online"** or create a new one
3. Click **"Add Product"** and select **"Threads"**

### 2. Configure Threads OAuth Settings

Navigate to: **Threads** → **Settings** (or **Basic Settings**)

#### Get Your Credentials:
- **Threads App ID** → Use this for `THREADS_APP_ID`
- **Threads App Secret** → Use this for `THREADS_APP_SECRET`

### 3. Add Valid OAuth Redirect URIs for Threads

In **Threads Settings**, add these redirect URIs:

#### Production (Vercel):
```
https://your-production-domain.vercel.app/api/auth/callback/threads
```

#### Local Development:
```
http://localhost:3000/api/auth/callback/threads
http://localhost:3001/api/auth/callback/threads
```

### 4. Required Permissions/Scopes

Make sure your app requests these Threads scopes:
- `threads_basic` - Basic profile information
- `threads_content_publish` - Ability to publish content

These are already configured in the code:
```typescript
scope: 'threads_basic,threads_content_publish'
```

### 5. Environment Variables for Threads

Add to your `.env.local`:

```env
# Threads OAuth
THREADS_APP_ID=your_threads_app_id_here
THREADS_APP_SECRET=your_threads_app_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here
```

For **Vercel** (Production), add in Vercel Dashboard → Settings → Environment Variables:
```
THREADS_APP_ID = your_threads_app_id
THREADS_APP_SECRET = your_threads_app_secret
NEXTAUTH_URL = https://your-production-domain.vercel.app
```

### 6. App Review (If Required)

**Note**: Threads API access may require Meta's app review process:

1. Go to **App Review** in your Meta App Dashboard
2. Request permissions for:
   - `threads_basic`
   - `threads_content_publish`
3. Provide required information about your app's usage
4. Wait for approval (usually 1-7 days)

### 7. Testing Threads Login

After configuration:

1. **Save all changes** in Meta Developer Dashboard
2. **Wait 1-2 minutes** for Meta to propagate settings
3. **Restart your dev server**: Stop and run `npm run dev` again
4. **Clear browser cookies** for your domain
5. **Click the Threads login button** (🧵 Threads)
6. **Authorize** when prompted

### 8. Threads API Endpoints

The current configuration uses:
- **Authorization**: `https://threads.net/oauth/authorize`
- **Token**: `https://graph.threads.net/oauth/access_token`
- **User Info**: `https://graph.threads.net/v1.0/me`

---

## Solution Steps for Facebook (Alternative)

### 1. Facebook App Dashboard Configuration

1. Go to https://developers.facebook.com/apps
2. Select your app **"Inabiz Online"** (App ID should match your FACEBOOK_CLIENT_ID)

### 2. Configure Valid OAuth Redirect URIs

Navigate to: **Facebook Login** → **Settings**

Add these redirect URIs:

#### Production (Vercel):
```
https://your-production-domain.vercel.app/api/auth/callback/facebook
```

#### Local Development:
```
http://localhost:3000/api/auth/callback/facebook
http://localhost:3001/api/auth/callback/facebook
```

### 3. Enable Required OAuth Settings

In **Facebook Login > Settings**, ensure these are enabled:

- ✅ **Client OAuth Login**: ON
- ✅ **Web OAuth Login**: ON
- ✅ **Use Strict Mode for Redirect URIs**: OFF (or ensure exact match)

### 4. App Domains Configuration

In **App Settings > Basic**:

Add your domains to:
- **App Domains**: `your-production-domain.vercel.app`, `localhost`
- **Privacy Policy URL**: Your privacy policy URL
- **Terms of Service URL**: Your terms URL

### 5. Website Platform Configuration

In **Settings > Basic**, add a platform:

1. Click **"+ Add Platform"**
2. Select **"Website"**
3. Add Site URL: `https://your-production-domain.vercel.app`
4. Add for localhost: `http://localhost:3000`

### 6. Environment Variables

Verify your `.env.local` contains:

```env
# Facebook OAuth
FACEBOOK_CLIENT_ID=your_app_id_here
FACEBOOK_CLIENT_SECRET=your_app_secret_here

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_here

# For production, Vercel should have:
# NEXTAUTH_URL=https://your-production-domain.vercel.app
```

### 7. NextAuth Callback URL Format

NextAuth uses this pattern for OAuth callbacks:
```
{NEXTAUTH_URL}/api/auth/callback/{provider}
```

For Facebook:
```
http://localhost:3000/api/auth/callback/facebook
```

### 8. Testing the Fix

After configuration:

1. **Save all changes** in Facebook App Dashboard
2. **Wait 1-2 minutes** for Facebook to propagate settings
3. **Clear your browser cookies** for localhost/your domain
4. **Try signing in again**

### 9. Common Issues

#### Issue: Still getting URL blocked
- **Solution**: Double-check the redirect URI matches exactly (including http/https, port)
- Verify no typos in the Facebook App dashboard

#### Issue: Different error after fix
- **Solution**: Check browser console for detailed error messages
- Verify FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET are correct

#### Issue: Works locally but not on Vercel
- **Solution**: Add Vercel production URL to Facebook App settings
- Set NEXTAUTH_URL environment variable in Vercel dashboard

### 10. Vercel Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add:
```
FACEBOOK_CLIENT_ID = your_app_id
FACEBOOK_CLIENT_SECRET = your_app_secret
NEXTAUTH_URL = https://your-production-domain.vercel.app
NEXTAUTH_SECRET = your_random_secret (same as local)
```

## Quick Checklist

- [ ] Facebook App has correct redirect URIs added
- [ ] Client OAuth Login is enabled
- [ ] Web OAuth Login is enabled
- [ ] App Domain includes your domain
- [ ] Platform website added with site URL
- [ ] NEXTAUTH_URL environment variable set correctly
- [ ] FACEBOOK_CLIENT_ID and FACEBOOK_CLIENT_SECRET are correct
- [ ] Waited 1-2 minutes after saving Facebook settings
- [ ] Cleared browser cache/cookies
- [ ] Tested with a fresh incognito window

## Need More Help?

Check the NextAuth.js documentation:
- https://next-auth.js.org/providers/facebook
- https://next-auth.js.org/configuration/providers/oauth

Check Facebook Login documentation:
- https://developers.facebook.com/docs/facebook-login/web
