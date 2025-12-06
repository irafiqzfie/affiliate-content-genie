# Cloudflare R2 Setup Guide

## Quick Start: Setting Up R2 for Image Storage

### Step 1: Create R2 Bucket

1. **Login to Cloudflare**
   - Go to https://dash.cloudflare.com
   - Navigate to **R2 Object Storage** in the left sidebar

2. **Create Bucket**
   - Click **Create bucket**
   - **Bucket name**: `affiliate-content-genie`
   - **Region**: Auto (Cloudflare will select the optimal location)
   - Click **Create bucket**

### Step 2: Configure Public Access

1. **Enable Public Access**
   - In your bucket, go to **Settings** tab
   - Under **Public access**, click **Allow Access**
   
2. **Optional: Add Custom Domain**
   - Click **Connect Domain**
   - Enter: `cdn.inabiz.online` (or your preferred subdomain)
   - Follow the DNS setup instructions:
     - Add a CNAME record pointing to your R2 bucket
     - Wait for DNS propagation (usually 5-10 minutes)
   
3. **Alternative: Use Auto-Generated Domain**
   - If you skip custom domain, use: `https://pub-[YOUR_ACCOUNT_ID].r2.dev`

### Step 3: Set Up CORS Policy

1. **Add CORS Configuration**
   - In bucket settings, go to **Settings** → **CORS Policy**
   - Click **Edit CORS Policy**
   - Paste this configuration:

```json
[
  {
    "AllowedOrigins": [
      "https://www.inabiz.online",
      "https://inabiz.online",
      "http://localhost:3000"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

   - Click **Save**

### Step 4: Generate API Tokens

1. **Create API Token**
   - Go to **R2** (top level) → **Manage R2 API Tokens**
   - Click **Create API Token**
   
2. **Token Configuration**
   - **Token name**: `affiliate-content-genie-production`
   - **Permissions**: 
     - ✅ Object Read & Write
   - **TTL**: Never expire (or set custom expiration)
   - **Bucket scope**: 
     - Select **Apply to specific buckets only**
     - Choose: `affiliate-content-genie`
   
3. **Save Credentials**
   - Click **Create API Token**
   - **IMPORTANT**: Copy these values immediately (you won't see them again):
     - ✅ `Access Key ID`
     - ✅ `Secret Access Key`
     - ✅ `Account ID` (also shown)

### Step 5: Update Environment Variables

1. **Local Development (.env.local)**

Add these lines to your `.env.local` file:

```env
# Cloudflare R2
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=affiliate-content-genie
R2_PUBLIC_URL=https://cdn.inabiz.online
# Or if using auto domain: https://pub-XXXXX.r2.dev
```

2. **Vercel Production**

   - Go to Vercel Dashboard → Your Project
   - Navigate to **Settings** → **Environment Variables**
   - Add each R2 variable:
     - `R2_ACCOUNT_ID`
     - `R2_ACCESS_KEY_ID`
     - `R2_SECRET_ACCESS_KEY`
     - `R2_BUCKET_NAME`
     - `R2_PUBLIC_URL`
   - For each variable, select: **Production**, **Preview**, **Development**
   - Click **Save**

### Step 6: Test Locally

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test Image Upload**
   - Go to http://localhost:3000
   - Generate content with image
   - Check console logs for:
     ```
     📤 Uploading image to Cloudflare R2 (XX.XX KB)
     ✅ Image uploaded to R2: https://cdn.inabiz.online/generated/...
     ```

3. **Verify in R2 Dashboard**
   - Go back to Cloudflare → R2 → Your Bucket
   - Check **Objects** tab
   - You should see files in folders: `generated/`, `placeholders/`, `user-content/`

### Step 7: Deploy to Production

1. **Commit and Push**
   ```bash
   git add .
   git commit -m "feat: Migrate to Cloudflare R2 storage"
   git push origin main
   ```

2. **Verify Deployment**
   - Vercel will auto-deploy
   - Check build logs for any errors
   - Test image upload on production site

3. **Monitor R2 Usage**
   - Go to Cloudflare Dashboard → R2
   - Check **Usage** tab to monitor:
     - Storage used
     - Class A operations (PUT, LIST)
     - Class B operations (GET, HEAD)

## Troubleshooting

### Images Not Loading

**Check 1: CORS Configuration**
- Ensure CORS policy includes your domain
- Check browser console for CORS errors

**Check 2: Public Access**
- Verify bucket has public access enabled
- Test URL directly in browser

**Check 3: Environment Variables**
- Verify all R2 variables are set correctly
- Check for typos in Account ID

### Upload Fails

**Check 1: API Token Permissions**
- Ensure token has Object Read & Write
- Verify token is scoped to correct bucket

**Check 2: Bucket Name**
- Ensure `R2_BUCKET_NAME` matches actual bucket name

**Check 3: Logs**
- Check Vercel logs for detailed error messages

### Custom Domain Not Working

**DNS Not Propagated**
- Wait 5-30 minutes for DNS changes
- Use `dig cdn.inabiz.online` to verify

**CNAME Record**
- Ensure CNAME points to R2 bucket URL
- Remove proxy (orange cloud) if using Cloudflare DNS

## Cost Monitoring

### Current R2 Pricing (as of Dec 2025)

- **Storage**: $0.015/GB/month
- **Class A Operations**: $4.50/million (PUT, LIST)
- **Class B Operations**: $0.36/million (GET, HEAD)
- **Egress**: **FREE** (no bandwidth charges!)

### Estimated Monthly Costs

**Low Traffic** (1,000 images, 10,000 views):
- Storage: 1GB × $0.015 = $0.015
- Class A: 1,000 PUTs × $0.0000045 = $0.005
- Class B: 10,000 GETs × $0.00000036 = $0.004
- **Total**: ~$0.02/month

**High Traffic** (10,000 images, 1M views):
- Storage: 10GB × $0.015 = $0.15
- Class A: 10,000 PUTs × $0.0000045 = $0.045
- Class B: 1M GETs × $0.00000036 = $0.36
- **Total**: ~$0.55/month

**vs Vercel Blob**: Would cost ~$300/month for 1TB egress!

## Next Steps

- ✅ R2 bucket created and configured
- ✅ Environment variables set
- ✅ Code deployed to production
- ⏳ Monitor for 24-48 hours
- 🔄 Optionally remove Vercel Blob after 30 days

## Support Resources

- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [R2 Pricing Calculator](https://developers.cloudflare.com/r2/pricing/)
- [AWS S3 API Compatibility](https://developers.cloudflare.com/r2/api/s3/)
