# Affiliate Content Genie - Production Deployment Checklist

✅ **Build Status**: All UI improvements compiled successfully  
✅ **Recent Commits**: 7 commits including 6 UI enhancements + 1 deploy script fix  
✅ **Framework**: Next.js 15.5.5 with Turbopack  

## Pre-Deployment Verification

- [x] Build completes without errors: `npm run build` ✅
- [x] All UI improvements implemented and committed
- [x] Deploy script handles Windows file permission issues
- [x] Migrations exist and are ready: `prisma/migrations/`

## Required Environment Variables (Vercel)

Add these to your Vercel project under **Settings → Environment Variables**:

### Core Database
- `DATABASE_URL` — Production PostgreSQL connection string  
  Example: `postgres://user:password@host:5432/database`

### NextAuth
- `NEXTAUTH_URL` — Your Vercel app URL  
  Example: `https://affiliate-content-genie.vercel.app`
- `NEXTAUTH_SECRET` — 32+ character random secret (base64 recommended)

### API Keys
- `API_KEY` — Google Gemini API key for content generation
- `STABILITY_API_KEY` — Stability AI API key (optional for image generation)
- `REPLICATE_API_KEY` — Replicate API key (optional for image transforms)

### OAuth Credentials
- `FACEBOOK_CLIENT_ID` — Facebook App ID
- `FACEBOOK_CLIENT_SECRET` — Facebook App secret
- `THREADS_APP_ID` — Threads App ID
- `THREADS_APP_SECRET` — Threads App secret

## Vercel Build Configuration

**Build Command**: `npm run build && npm run prisma:deploy`  
**Install Command**: `npm ci`  
**Output Directory**: `.next` (auto-detected)  

*Note: The `prisma:deploy` command runs `prisma migrate deploy` to apply pending migrations to production.*

## Deployment Steps

### Option A: Git Push (Recommended)
1. Ensure all commits are pushed to your repository
2. Vercel will automatically build and deploy on push
3. Monitor the Vercel dashboard for build progress

```bash
git push origin main
```

### Option B: Vercel Dashboard Manual Deploy
1. Open your Vercel project: https://vercel.com/dashboard
2. Navigate to your project
3. Click "Redeploy" on the latest commit
4. Verify environment variables are set

### Option C: Vercel CLI
```powershell
npm install -g vercel
vercel --prod
```

## Post-Deployment Verification

After deployment, test these features:

1. **UI Rendering** ✓
   - Verify header displays correctly (optimized spacing)
   - Check section headers have blue/orange gradients
   - Confirm segmented control tabs render properly

2. **Sticky Features** ✓
   - Navigate to Scheduler page
   - Scroll down — "Ready To Post" section should stay visible at top
   - Green status chip should display

3. **Post History** ✓
   - Verify post history items display at fixed 120px height
   - Click items to expand affiliate link details
   - Hover to see delete button

4. **Modal Features** ✓
   - Generate content
   - Confirm Modal appears with card-style post type selections
   - Test all three post type options

5. **Database Connectivity** ✓
   - Verify saved items save and load
   - Check scheduled posts appear in history

## Common Issues & Solutions

### Build fails with "Database migration error"
- Ensure `DATABASE_URL` points to production PostgreSQL
- Verify Vercel can reach the database (check firewall/VPN)
- Check migration files exist: `prisma/migrations/`

### NextAuth sign-in fails
- Verify `NEXTAUTH_URL`, `NEXTAUTH_SECRET` are set correctly
- Check Facebook/Threads redirect URIs match exactly
- Ensure provider secrets are current (not expired)

### "Cannot find module" errors
- Clear Vercel cache: Project Settings → Git → Clear Cache
- Redeploy from Vercel dashboard

### Performance slow
- Check that Turbopack build completed (`✓ Compiled successfully` in output)
- Monitor first load JS: should be ~157 kB for home page

## Rollback Instructions

If issues occur:

1. **Revert to previous commit**:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Redeploy from Vercel**: Dashboard will automatically trigger new build

3. **Check deployment logs**: Vercel → Deployments → View logs

## Production Monitoring

### Suggested Monitoring
- Use Vercel Analytics dashboard (included)
- Monitor database query performance
- Set up error tracking (Sentry recommended)
- Watch Vercel function logs for API errors

### Health Check
```
GET /api/test-env
```
Returns environment variable status (for debugging only, consider disabling in production)

## Performance Metrics

**Build Output** (from last build):
- Home page: 31.8 kB route size, 157 kB first load JS
- Build time: ~56ms write time, 3.9s compile time
- Pages: 26/26 static pages generated
- Routes: 7 API routes (dynamic), 10 pages

## Security Reminders

⚠️ **Do NOT commit**:
- `.env.local` files
- Database connection strings
- API keys or secrets
- OAuth credentials

✅ **Always use**:
- Vercel Environment Variables (for production secrets)
- HTTPS only (auto-enabled on Vercel)
- NEXTAUTH_SECRET (32+ chars, rotate periodically)

## Next Steps

After successful deployment:
1. Test all features in production
2. Monitor error logs
3. Collect user feedback
4. Plan for future enhancements

---

**Last Updated**: 2025-11-25  
**Build Status**: ✅ Production Ready  
**Latest Commit**: da2006a (Deploy script Windows compatibility fix)
