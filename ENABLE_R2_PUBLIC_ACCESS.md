# 🚨 IMPORTANT: Enable Public Access for R2

## Current Issue
Your R2 bucket is configured correctly, but files are not publicly accessible.

**Test URL**: https://147bdf35cc806ff53ee7df08a52bd112.r2.cloudflarestorage.com/test/test-1765067953857.svg

If this URL shows an access denied error, follow these steps:

---

## Solution: Enable Public Access

### Option 1: Use R2.dev Public Domain (Easiest)

1. **Go to Cloudflare Dashboard**
   - Navigate to **R2 Object Storage**
   - Click on your bucket: `inabiz-online`

2. **Enable R2.dev Public Access**
   - Go to **Settings** tab
   - Find **R2.dev subdomain** section
   - Click **Allow Access**
   - You'll get a URL like: `https://pub-xxxxx.r2.dev`

3. **Update Environment Variable**
   Update your `.env.local`:
   ```env
   R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
   ```
   (Replace `xxxxx` with your actual subdomain)

4. **Also update Vercel**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Update `R2_PUBLIC_URL` to the new `https://pub-xxxxx.r2.dev` URL

---

### Option 2: Use Custom Domain (Recommended for Production)

1. **Connect Custom Domain**
   - In bucket settings, click **Connect Domain**
   - Enter: `cdn.inabiz.online` (or your preferred subdomain)

2. **Add DNS Record**
   - Go to your Cloudflare DNS settings
   - Add a CNAME record:
     ```
     Type: CNAME
     Name: cdn
     Target: [your-bucket-url].r2.cloudflarestorage.com
     Proxy: OFF (gray cloud, not orange)
     ```

3. **Wait for DNS**
   - Wait 5-10 minutes for DNS propagation

4. **Update Environment Variables**
   ```env
   R2_PUBLIC_URL=https://cdn.inabiz.online
   ```

---

## Quick Fix (For Now)

**Use R2.dev subdomain** - it's the fastest way to get public access:

1. Go to your R2 bucket settings
2. Enable R2.dev subdomain
3. Copy the public URL (e.g., `https://pub-abc123.r2.dev`)
4. Update `.env.local`:
   ```env
   R2_PUBLIC_URL=https://pub-abc123.r2.dev
   ```
5. Restart dev server: `npm run dev`

---

## Verify Public Access

After enabling, test this URL in your browser:
```
https://[YOUR_PUBLIC_URL]/test/test-1765067953857.svg
```

You should see a green SVG with "TEST" text.

---

## Current Configuration

```
Account ID: 147bdf35cc806ff53ee7df08a52bd112
Bucket: inabiz-online
Current URL: https://147bdf35cc806ff53ee7df08a52bd112.r2.cloudflarestorage.com (❌ Not public)
Needed: https://pub-xxxxx.r2.dev (✅ Public access)
```

---

**Next Step**: Go to Cloudflare R2 bucket settings and enable R2.dev subdomain! 🚀
