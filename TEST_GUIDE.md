# 🧪 Quick Test Guide - Replicate Image-to-Image

## Test the AI Transformation Feature

### Step 1: Upload Product Image
1. Go to http://localhost:3000
2. Look for "Product Images" section
3. Click "Click to upload images"
4. Select a product photo (office chair, water bottle, etc.)
5. See your image appear in the grid with "Primary" badge

### Step 2: Generate Content
**Option A - With Shopee Link:**
1. Paste a Shopee product link
2. Click "AI Analyze & Fill"
3. Click "Generate Content"

**Option B - Manual Input:**
1. Fill in Product Title: "Ergonomic Office Chair"
2. Upload image (done in Step 1)
3. Add Custom Description: "Comfortable mesh chair with lumbar support"
4. Click "Generate Content"

### Step 3: Transform Image with AI
1. Wait for content to generate (~20-30 seconds)
2. Look for the "📷 Image Prompt" section
3. You'll see 3 options - each with a "Generate Image" button
4. Click any "Generate Image" button
5. **Watch the console** for these logs:

```
🎨 Image generation API called
🖼️ Using uploaded product image for AI transformation
📝 Transformation type: enhance
🚀 Starting Replicate img2img transformation...
⏳ Prediction started: [id]
⏳ Still processing... (5s)
⏳ Still processing... (10s)
✅ Image transformation complete!
```

### Step 4: See the Result
- After ~15-30 seconds, the transformed image appears
- Compare with your original uploaded image
- Notice improved lighting, colors, and professional look

## 🎯 What to Expect

### Before (Your Upload):
- Phone camera photo
- Poor lighting
- Cluttered background
- Washed out colors

### After (AI Transformed):
- ✨ Professional studio lighting
- 🎨 Enhanced colors and contrast
- 🏞️ Cleaner background
- 📸 Sharp, high-quality appearance
- ✅ Product still recognizable

## 🐛 Troubleshooting

### "No image generated after 60 seconds"
- **Cause:** Replicate API timeout or overload
- **Solution:** Try again with a simpler prompt or smaller image

### "Replicate API error"
- **Check:** REPLICATE_API_KEY in .env.local
- **Check:** API key is valid (not expired)
- **Fallback:** System returns original image

### Image doesn't look transformed
- **Increase strength:** Edit `route.ts`, change `strength: 0.35` to `0.5`
- **Better prompt:** Make prompt more specific
- **Try different option:** Click another "Generate Image" button

### Server console shows "REPLICATE_API_KEY not found"
- **Fix:** Restart the dev server after adding the key to `.env.local`
- **Command:** Stop server (Ctrl+C) and run `npm run dev` again

## 📊 Monitor API Usage

Check your Replicate dashboard:
- Go to https://replicate.com/account/billing
- View usage statistics
- Monitor costs per image
- Set billing alerts if needed

## 🎨 Advanced Testing

### Test Different Transformation Strengths:

**Subtle (0.2-0.3):**
- Minimal changes
- Mostly color/lighting correction
- Product stays almost identical

**Moderate (0.35-0.5):**
- Noticeable improvements
- Better composition
- Enhanced details

**Strong (0.6-0.8):**
- Significant changes
- Background replacement
- Style transfer effects

### Test Different Prompts:

1. **Minimalist:** "clean white background, minimalist studio photography"
2. **Lifestyle:** "product in modern home setting, natural lighting"
3. **Dramatic:** "dramatic lighting, high contrast, cinematic"
4. **Vintage:** "vintage photography style, warm tones, film grain"

## ✅ Success Criteria

- [ ] Image uploads successfully
- [ ] Content generates with image-aware prompts
- [ ] "Generate Image" triggers Replicate API
- [ ] Console shows transformation progress
- [ ] Transformed image appears in ~15-30 seconds
- [ ] Image looks professionally enhanced
- [ ] Product remains identifiable
- [ ] No errors in console

## 📸 Example Test Products

Good products to test with:
- ✅ Office chairs (clear subject, good detail)
- ✅ Water bottles (simple shape, easy to enhance)
- ✅ Electronics (phones, laptops)
- ✅ Home decor items
- ✅ Clothing (on mannequin or flat lay)

Avoid:
- ❌ Very blurry images
- ❌ Multiple products in one image
- ❌ Dark or underexposed photos
- ❌ Images with watermarks/text

---

**Ready to test? Go to http://localhost:3000 and try it out! 🚀**
