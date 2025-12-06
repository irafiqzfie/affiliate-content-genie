# 🚀 R2 Migration - Quick Reference

## ✅ What Was Done

### 1. Dependencies Installed
```bash
✅ @aws-sdk/client-s3
✅ @aws-sdk/s3-request-presigner
✅ uuid
```

### 2. Files Created
```
✅ src/lib/r2.ts                              - R2 client & utilities
✅ src/lib/uploadToR2.ts                      - Client-side upload helpers
✅ src/app/api/r2/upload-url/route.ts         - Presigned URL generation
✅ src/app/api/r2/delete/route.ts             - File deletion with security
✅ R2_SETUP_GUIDE.md                          - Complete setup instructions
✅ MIGRATION_R2.md                            - Technical migration guide
```

### 3. Files Updated
```
✅ src/app/api/upload-image/route.ts          - R2 support + fallback
✅ src/app/api/visualize/image/route.ts       - Placeholder upload to R2
✅ .env.local                                 - Added R2 variables
✅ README.md                                  - Updated documentation
```

### 4. Build Status
```
✅ npm run build - Successful
✅ TypeScript compilation - No errors
✅ All routes registered
```

---

## 🎯 Next Steps

### Step 1: Set Up Cloudflare R2 (15 minutes)

1. **Create R2 Bucket**
   - Go to https://dash.cloudflare.com
   - Navigate to **R2 Object Storage**
   - Create bucket: `affiliate-content-genie`

2. **Generate API Token**
   - Go to **R2** → **Manage R2 API Tokens**
   - Create token with **Object Read & Write**
   - Save credentials (you won't see them again!)

3. **Configure CORS**
   - Add your domains to CORS policy
   - See `R2_SETUP_GUIDE.md` for exact JSON

4. **Update .env.local**
   ```env
   R2_ACCOUNT_ID=your_account_id
   R2_ACCESS_KEY_ID=your_access_key
   R2_SECRET_ACCESS_KEY=your_secret_key
   R2_BUCKET_NAME=affiliate-content-genie
   R2_PUBLIC_URL=https://cdn.inabiz.online
   ```

### Step 2: Test Locally (5 minutes)

```bash
npm run dev
```

1. Generate content with image
2. Check console logs:
   ```
   📤 Uploading image to Cloudflare R2 (XX.XX KB)
   ✅ Image uploaded to R2: https://cdn.inabiz.online/...
   ```
3. Verify in R2 dashboard (Objects tab)

### Step 3: Deploy to Production (10 minutes)

1. **Add Variables to Vercel**
   - Dashboard → Settings → Environment Variables
   - Add all 5 R2 variables
   - Set for: Production, Preview, Development

2. **Deploy**
   ```bash
   git add .
   git commit -m "feat: Migrate to Cloudflare R2 storage"
   git push origin main
   ```

3. **Verify**
   - Test image upload on production
   - Check R2 dashboard for new files

---

## 🔧 How It Works

### Upload Flow

```
1. Client generates/uploads image
   ↓
2. POST /api/upload-image (with useR2=true)
   ↓
3. Try R2 upload via uploadToR2()
   ↓ (if R2 fails)
4. Fallback to Vercel Blob
   ↓
5. Return public URL to client
```

### Backward Compatibility

```
Old posts with Vercel Blob URLs → Still work! ✅
New uploads → Use R2 automatically ✅
R2 fails → Falls back to Vercel Blob ✅
```

---

## 📊 Cost Savings

### Before (Vercel Blob)
- **1TB bandwidth**: ~$300/month
- **Storage**: $0.15/GB/month

### After (Cloudflare R2)
- **Unlimited bandwidth**: $0 🎉
- **Storage**: $0.015/GB/month (10x cheaper!)

**Estimated savings**: 90%+ for high-traffic apps

---

## 🔍 Troubleshooting

### Images Not Uploading?

**Check 1: Environment Variables**
```bash
echo $R2_ACCOUNT_ID
# Should print your account ID
```

**Check 2: R2 Configuration**
- Verify CORS policy includes your domain
- Check bucket has public access enabled

**Check 3: Logs**
```bash
# Look for these in console:
📤 Uploading image to Cloudflare R2...
✅ Image uploaded to R2: ...

# Or fallback:
⚠️ R2 upload failed, falling back to Vercel Blob
```

### Images Not Loading?

**Check 1: Public URL**
- Verify `R2_PUBLIC_URL` is correct
- Test URL directly in browser

**Check 2: CORS**
- Check browser console for CORS errors
- Add your domain to R2 CORS policy

### Still Using Vercel Blob?

**Check environment variables**
```typescript
// In route.ts, add logging:
console.log('R2_ACCOUNT_ID:', process.env.R2_ACCOUNT_ID ? 'SET' : 'NOT SET');
```

---

## 📚 Documentation

- **[R2_SETUP_GUIDE.md](./R2_SETUP_GUIDE.md)** - Step-by-step setup
- **[MIGRATION_R2.md](./MIGRATION_R2.md)** - Complete technical details
- **[Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)** - Official docs

---

## 🎉 Benefits Summary

✅ **Cost**: 90% cheaper than Vercel Blob  
✅ **Performance**: Global CDN with edge caching  
✅ **Bandwidth**: Unlimited free egress  
✅ **Backward Compatible**: Old URLs still work  
✅ **Scalable**: Handles high traffic effortlessly  
✅ **Fallback**: Auto-fallback to Vercel Blob if R2 fails  

---

## 🆘 Need Help?

1. Check `R2_SETUP_GUIDE.md` for detailed instructions
2. Verify environment variables are set correctly
3. Check console logs for error messages
4. Verify R2 dashboard shows your bucket and files

---

**Ready to go live?** Follow the 3 steps above! 🚀
