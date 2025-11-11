# Meta Platform Compliance Guide

This document outlines the steps to ensure your app complies with Meta Platform Terms and Policies.

## ✅ Completed

1. **Data Deletion Callback Endpoint**: `/api/auth/delete-data`
2. **User-Facing Data Deletion Page**: `/delete-data`
3. **Updated Privacy Policy**: `/privacy` (includes Facebook-specific sections)
4. **Terms of Service**: `/terms`

## 🔧 Setup Required in Facebook App Dashboard

### Step 1: Register Data Deletion Callback URL

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Select your app
3. Navigate to **Settings** > **Basic**
4. Scroll down to **Data Deletion Requests**
5. Enter your Data Deletion Request URL:
   ```
   https://yourdomain.com/api/auth/delete-data
   ```
6. Click **Save Changes**

### Step 2: Add Privacy Policy URL

1. In the same **Basic Settings** page
2. Add **Privacy Policy URL**:
   ```
   https://yourdomain.com/privacy
   ```
3. Add **Terms of Service URL**:
   ```
   https://yourdomain.com/terms
   ```

### Step 3: Set App Domain

1. Add your domain to **App Domains**:
   ```
   yourdomain.com
   ```

### Step 4: Configure OAuth Redirect URIs

1. Go to **Facebook Login** > **Settings**
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://yourdomain.com/api/auth/callback/facebook
   http://localhost:3000/api/auth/callback/facebook (for development)
   ```

## 🧪 Testing Data Deletion

### Test with Facebook's Signed Request

You can test the deletion endpoint using Facebook's test tool:

1. Go to your app in Facebook Developers
2. Navigate to **Tools** > **Access Token Tool**
3. Generate a test user
4. Send a deletion request

### Manual Testing

Send a POST request to test locally:

```bash
# This will fail signature verification but tests the endpoint structure
curl -X POST http://localhost:3000/api/auth/delete-data \
  -H "Content-Type: application/json" \
  -d '{"signed_request": "test_signature.test_payload"}'
```

## 📋 Required Environment Variables

Make sure these are set in your `.env.local`:

```env
FACEBOOK_CLIENT_ID=your_facebook_app_id
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://yourdomain.com
DATABASE_URL=your_database_url
```

## 🔒 Security Checklist

- ✅ Data deletion endpoint verifies Facebook's signature
- ✅ HTTPS enforced in production (required by Facebook)
- ✅ Environment variables secured
- ✅ Database has proper foreign key constraints
- ✅ User data cascade deleted properly

## 📱 App Review Requirements (If Publishing)

If you need permissions beyond basic profile (email, public_profile):

### Required for Submission:

1. **Screen Recording**: Show the complete user flow
   - User clicks Facebook login
   - Permissions requested
   - How the data is used in your app
   - How to delete data

2. **Test User Credentials**: Provide test Facebook account
   - Create test users in Facebook App Dashboard
   - Share credentials with Facebook reviewers

3. **Detailed Use Case**: Explain why you need each permission
   - Example: "We need email to identify users and send notifications"

4. **Privacy Policy**: Must be publicly accessible
   - Link: `https://yourdomain.com/privacy`

5. **Data Deletion Instructions**: Must be clear and accessible
   - Link: `https://yourdomain.com/delete-data`

## 🌐 Data Deletion Callback Format

Facebook sends a POST request with this format:

```json
{
  "signed_request": "<signature>.<base64_payload>"
}
```

The payload contains:
```json
{
  "user_id": "facebook_user_id",
  "algorithm": "HMAC-SHA256",
  "issued_at": 1234567890
}
```

Your endpoint must return:
```json
{
  "url": "https://yourdomain.com/privacy?deletion_confirmed=true",
  "confirmation_code": "ABC123XYZ456"
}
```

## 🔗 Important Links

- [Meta Platform Terms](https://developers.facebook.com/terms)
- [Data Deletion Callback](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback)
- [Facebook Login Best Practices](https://developers.facebook.com/docs/facebook-login/security)
- [App Review](https://developers.facebook.com/docs/app-review)

## 📞 Support

For questions about compliance:
- Email: admin@inabiz.online
- Phone: 014-514 3981

## 📝 Checklist Before Going Live

- [ ] Data deletion endpoint registered in Facebook Dashboard
- [ ] Privacy Policy URL added to Facebook app settings
- [ ] Terms of Service URL added to Facebook app settings
- [ ] OAuth redirect URIs configured
- [ ] Test data deletion flow
- [ ] HTTPS enabled on production domain
- [ ] Environment variables set in production
- [ ] Database backups configured
- [ ] User data deletion tested manually
- [ ] App Review submitted (if needed)

---

**Last Updated**: November 2025
