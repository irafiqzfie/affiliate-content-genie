# Replicate API Integration - Image-to-Image Transformation

## ✅ Successfully Integrated!

The application now uses **Replicate's Stable Diffusion XL (SDXL)** for real AI-powered image-to-image transformations.

## 🔑 Configuration

**API Key Added:** `REPLICATE_API_KEY` in `.env.local`

```env
REPLICATE_API_KEY=your_replicate_api_key_here
```

## 🎨 How It Works

### 1. **User Uploads Product Images**
- Up to 5 images can be uploaded
- First image is marked as "Primary"
- Images are converted to base64 data URLs

### 2. **Content Generation**
- AI generates image prompts that reference the uploaded images
- Prompts are designed for enhancement, not random generation

### 3. **Image Transformation (NEW!)**
When user clicks "Generate Image":

```typescript
// API calls Replicate with:
{
  version: 'SDXL img2img model',
  input: {
    image: uploadedProductImage,           // Your uploaded image
    prompt: 'professional product photography, [AI prompt], high quality, 8k',
    negative_prompt: 'blurry, low quality, distorted',
    strength: 0.35,                        // How much to transform (0.35 = subtle enhancement)
    num_inference_steps: 30,               // Quality (higher = better but slower)
    guidance_scale: 7.5                    // How closely to follow prompt
  }
}
```

### 4. **Result**
- **Real AI-transformed image** returned in ~10-30 seconds
- Original uploaded image used as base
- Enhanced with professional lighting, improved composition, etc.
- Product identity preserved

## 📊 API Details

**Model Used:** `ac732df83cea7fff18b8472768c88ad041fa750ff7682a21affe81863cbe77e4`
- **Name:** Stable Diffusion XL (SDXL) img2img
- **Provider:** Replicate
- **Capability:** Image-to-image transformation
- **Cost:** ~$0.003-0.01 per image (check Replicate pricing)

**Processing Time:** 
- Starting: 1-5 seconds
- Processing: 10-25 seconds  
- Total: ~15-30 seconds average

## 🎯 Transformation Strength

The `strength` parameter controls how much the image changes:

- **0.2-0.3** - Subtle enhancement (lighting, colors)
- **0.35** - Moderate enhancement (current default)
- **0.4-0.6** - Significant changes (background, composition)
- **0.7-0.9** - Major transformation (style transfer)

## 🔄 Fallback Behavior

If Replicate API fails:
1. Logs the error
2. Returns the original uploaded image
3. User still gets a result (not broken)
4. Error message included in response

## 📝 Logs to Watch For

### Success Flow:
```
🎨 Image generation API called
🖼️ Using uploaded product image for AI transformation
📝 Transformation type: enhance
💡 Prompt: professional product photography...
🚀 Starting Replicate img2img transformation...
⏳ Prediction started: [prediction-id]
✅ Image transformation complete!
```

### No API Key:
```
⚠️ REPLICATE_API_KEY not found, returning original image
```

### API Error:
```
❌ Replicate transformation failed: [error]
📌 Falling back to original image
```

## 🧪 Testing

1. **Upload a product image** (e.g., office chair, water bottle)
2. **Paste Shopee link** or use manual input
3. **Click "Generate Content"**
4. **Click "Generate Image"** on any Image Prompt option
5. **Wait ~15-30 seconds**
6. **See the AI-transformed result!**

### Expected Results:
- ✅ Better lighting and exposure
- ✅ Professional studio look
- ✅ Enhanced colors and details
- ✅ Product remains identifiable
- ✅ Cleaner background

## 💰 Cost Estimates

Based on Replicate's pricing:
- **Per image:** ~$0.003-0.01
- **100 images:** ~$0.30-1.00
- **1,000 images:** ~$3.00-10.00

Much cheaper than hiring photographers! 📸

## 🔧 Advanced Configuration

To adjust transformation behavior, modify in `src/app/api/visualize/image/route.ts`:

```typescript
input: {
  image: conditionImage,
  prompt: `your custom prefix, ${outputText}, your custom suffix`,
  strength: 0.5,                    // Increase for more dramatic changes
  num_inference_steps: 50,          // Increase for higher quality
  guidance_scale: 7.5,              // Increase to follow prompt more closely
}
```

## 🚀 Production Checklist

- [x] Replicate API key configured
- [x] Image-to-image transformation working
- [x] Error handling implemented
- [x] Fallback to original image
- [x] Polling with timeout
- [x] Proper logging
- [ ] Monitor API usage/costs
- [ ] Add usage analytics
- [ ] Consider caching results
- [ ] Add user feedback mechanism

## 📚 Resources

- [Replicate API Docs](https://replicate.com/docs)
- [SDXL Model Page](https://replicate.com/stability-ai/sdxl)
- [Image-to-Image Guide](https://replicate.com/docs/guides/image-to-image)
- [Pricing Calculator](https://replicate.com/pricing)

## 🎉 What's Next?

**Optional Enhancements:**
1. **Multiple variations** - Generate 2-3 options per prompt
2. **Style presets** - "Minimalist", "Vibrant", "Vintage" buttons
3. **Before/After slider** - Compare original vs enhanced
4. **Batch processing** - Transform all uploaded images at once
5. **Save favorites** - Store best transformations
6. **A/B testing** - Let users pick best results

---

**Status:** ✅ **LIVE AND WORKING**

Test it now at http://localhost:3000 🚀
